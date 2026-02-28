import {
  ref,
  set,
  remove,
  onValue,
  off,
  get,
  push,
  runTransaction,
} from 'firebase/database';
import { db } from '../config/firebase';

export interface MatchData {
  user1: string;
  user2: string;
  channelName: string;
  createdAt: number;
}

/**
 * 대기열에 저장되는 유저 정보 타입
 * recentContacts: 최근 3번 만났던 상대방 uid 목록
 */
interface QueueUser {
  uid: string;
  joinedAt: number;
  recentContacts?: string[]; // 최근에 만난 상대방 uid 배열 (최대 3개)
}

/**
 * 매칭 대기열에 입장
 * @param uid - 현재 유저의 uid
 * @param recentContacts - 최근 3번 만났던 상대방 uid 목록 (기본값: 빈 배열)
 */
export async function joinQueue(uid: string, recentContacts: string[] = []): Promise<void> {
  const userQueueRef = ref(db, `queue/${uid}`);
  await set(userQueueRef, {
    uid,
    joinedAt: Date.now(),
    recentContacts, // 최근 만난 상대방 목록도 함께 저장 (매칭 시 제외 처리에 사용)
  });

  // 대기열에 2명 이상이면 자동 매칭 시도
  await tryMatch(uid);
}

/**
 * 매칭 대기열에서 이탈
 */
export async function leaveQueue(uid: string): Promise<void> {
  const userQueueRef = ref(db, `queue/${uid}`);
  await remove(userQueueRef);
}

/**
 * 매칭 완료 리스닝
 * @returns unsubscribe 함수
 */
export function listenForMatch(
  uid: string,
  callback: (matchData: MatchData | null) => void
): () => void {
  const matchesRef = ref(db, 'matches');

  const listener = onValue(matchesRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const matches = snapshot.val();
    for (const matchId in matches) {
      const match: MatchData = matches[matchId];
      if (match.user1 === uid || match.user2 === uid) {
        callback(match);
        return;
      }
    }
  });

  return () => off(matchesRef, 'value', listener);
}

/**
 * 매칭 데이터 삭제 (통화 종료 후)
 */
export async function removeMatch(uid: string): Promise<void> {
  const matchesRef = ref(db, 'matches');
  const snapshot = await get(matchesRef);
  if (!snapshot.exists()) return;

  const matches = snapshot.val();
  for (const matchId in matches) {
    const match = matches[matchId];
    if (match.user1 === uid || match.user2 === uid) {
      await remove(ref(db, `matches/${matchId}`));
      return;
    }
  }
}

/**
 * 대기열에서 현재 유저와 매칭 가능한 상대를 찾아 매칭
 *
 * [핵심] runTransaction으로 queue 노드를 원자적으로 수정:
 *   - 두 유저가 동시에 tryMatch를 호출해도 단 하나의 트랜잭션만 성공
 *   - 성공한 쪽만 match 데이터를 생성하므로 중복 매칭 방지
 *
 * [최근 만남 제외] recentContacts 배열을 이용해 최근 3번 만난 상대는 매칭에서 제외:
 *   - 현재 유저의 recentContacts에 상대방 uid가 있으면 건너뜀
 *   - 상대방의 recentContacts에 현재 uid가 있어도 건너뜀 (양방향 체크)
 */
async function tryMatch(currentUid: string): Promise<void> {
  const queueRef = ref(db, 'queue');

  // 트랜잭션 성공 후 match 생성에 필요한 uid를 저장
  let matchedUser1: string | null = null;
  let matchedUser2: string | null = null;

  const { committed } = await runTransaction(queueRef, (queue) => {
    if (!queue) return queue;

    // 대기열의 모든 유저를 배열로 변환 (recentContacts 포함)
    const users = Object.values(queue) as QueueUser[];

    // 가장 오래 기다린 유저부터 매칭되도록 joinedAt 기준 오름차순 정렬
    users.sort((a, b) => a.joinedAt - b.joinedAt);

    if (users.length < 2) return queue;

    // 현재 유저가 대기열에 있는지 확인
    const currentUser = users.find((u) => u.uid === currentUid);
    if (!currentUser) return queue; // 현재 유저가 없으면 매칭 안 함

    // 현재 유저의 최근 만남 목록 (없으면 빈 배열)
    const currentRecent = currentUser.recentContacts ?? [];

    // 현재 유저와 매칭 가능한 첫 번째 상대 찾기
    // 조건: 자기 자신이 아니고, 서로의 recentContacts에 없는 유저
    const partner = users.find((u) => {
      // 자기 자신은 제외
      if (u.uid === currentUid) return false;

      const partnerRecent = u.recentContacts ?? [];

      // 현재 유저의 최근 목록에 상대방이 있으면 제외
      // 상대방의 최근 목록에 현재 유저가 있어도 제외 (양방향 체크)
      const alreadyMet =
        currentRecent.includes(u.uid) || partnerRecent.includes(currentUid);

      return !alreadyMet; // 서로 처음 만나거나 최근 3번 안에 없는 경우만 통과
    });

    // 매칭 가능한 상대가 없으면 대기열 유지 (나중에 새 유저가 들어오면 재시도)
    if (!partner) return queue;

    // 두 유저를 대기열에서 원자적으로 제거
    const newQueue = { ...queue };
    delete newQueue[currentUid];
    delete newQueue[partner.uid];

    // 트랜잭션 콜백 외부에서 사용할 uid 캡처
    matchedUser1 = currentUid;
    matchedUser2 = partner.uid;

    return newQueue;
  });

  // 트랜잭션이 실제로 매칭을 발생시킨 경우에만 match 생성
  if (committed && matchedUser1 && matchedUser2) {
    const matchRef = push(ref(db, 'matches'));
    const matchId = matchRef.key!;
    const channelName = `channel_${matchId}`;

    await set(matchRef, {
      user1: matchedUser1,
      user2: matchedUser2,
      channelName,
      createdAt: Date.now(),
    });
  }
}
