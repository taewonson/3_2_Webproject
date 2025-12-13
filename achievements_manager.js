// achievements_manager.js
// ========================================
//  Snake Web Game - Achievements Manager (v2)
//  - Classic / Expert 업적을 분리 관리
//  - Web Storage API(localStorage)에 진행 상태 저장
//  - 시간(초) 관련 업적/기능은 전부 제거
// ========================================

(function (global) {
  const STORAGE_KEY = "snake_achievements_v2";

  // -----------------------------
  // 업적 정의 (모드별)
  // -----------------------------
  const DEFINITIONS = {
    // ✅ Classic 업적: "한 판" 기준 점수 중심 (게임 로직 변경 없음)
    classic: [
      { id: "c_first_apple", title: "첫 한 입 (Classic)", desc: "Classic에서 사과를 1개 이상 먹기", conditionText: "한 판에서 점수 1점 이상", check: (ctx) => ctx.score >= 1 },

      { id: "c_score_5",  title: "Classic 5점",  desc: "Classic에서 점수 5점 달성",  conditionText: "한 판에서 점수 5점 이상",  check: (ctx) => ctx.score >= 5 },
      { id: "c_score_10", title: "Classic 10점", desc: "Classic에서 점수 10점 달성", conditionText: "한 판에서 점수 10점 이상", check: (ctx) => ctx.score >= 10 },
      { id: "c_score_15", title: "Classic 15점", desc: "Classic에서 점수 15점 달성", conditionText: "한 판에서 점수 15점 이상", check: (ctx) => ctx.score >= 15 },
      { id: "c_score_20", title: "Classic 20점", desc: "Classic에서 점수 20점 달성", conditionText: "한 판에서 점수 20점 이상", check: (ctx) => ctx.score >= 20 },
      { id: "c_score_30", title: "Classic 30점", desc: "Classic에서 점수 30점 달성", conditionText: "한 판에서 점수 30점 이상", check: (ctx) => ctx.score >= 30 },
      { id: "c_score_40", title: "Classic 40점", desc: "Classic에서 점수 40점 달성", conditionText: "한 판에서 점수 40점 이상", check: (ctx) => ctx.score >= 40 },
      { id: "c_score_50", title: "Classic 50점", desc: "Classic에서 점수 50점 달성", conditionText: "한 판에서 점수 50점 이상", check: (ctx) => ctx.score >= 50 },
      { id: "c_score_75", title: "Classic 75점", desc: "Classic에서 점수 75점 달성", conditionText: "한 판에서 점수 75점 이상", check: (ctx) => ctx.score >= 75 },
      { id: "c_score_100", title: "Classic 100점", desc: "Classic에서 점수 100점 달성", conditionText: "한 판에서 점수 100점 이상", check: (ctx) => ctx.score >= 100 }
    ],

    // ✅ Expert 업적: 기존 이벤트만 사용 (점수/아이템등장/속도이벤트/차원이동 성공)
    expert: [
      { id: "e_first_apple", title: "첫 한 입 (Expert)", desc: "Expert에서 사과를 1개 이상 먹기", conditionText: "한 판에서 점수 1점 이상", check: (ctx) => ctx.score >= 1 },

      // 점수 기반
      { id: "e_score_10", title: "Expert 10점", desc: "Expert에서 점수 10점 달성", conditionText: "한 판에서 점수 10점 이상", check: (ctx) => ctx.score >= 10 },
      { id: "e_score_25", title: "Expert 25점", desc: "Expert에서 점수 25점 달성", conditionText: "한 판에서 점수 25점 이상", check: (ctx) => ctx.score >= 25 },
      { id: "e_score_40", title: "Expert 40점", desc: "Expert에서 점수 40점 달성", conditionText: "한 판에서 점수 40점 이상", check: (ctx) => ctx.score >= 40 },

      // 아이템 등장(= 획득으로 간주되는 이벤트)
      { id: "e_first_item_spawn", title: "첫 아이템 등장 (Expert)", desc: "Expert에서 아이템이 1회 이상 등장", conditionText: "한 판에서 아이템 등장 1회 이상", check: (ctx) => ctx.itemsSpawned >= 1 },
      { id: "e_item_spawn_3", title: "아이템 파티 (Expert)", desc: "Expert에서 아이템이 3회 이상 등장", conditionText: "한 판에서 아이템 등장 3회 이상", check: (ctx) => ctx.itemsSpawned >= 3 },
      { id: "e_item_spawn_5", title: "아이템 러시 (Expert)", desc: "Expert에서 아이템이 5회 이상 등장", conditionText: "한 판에서 아이템 등장 5회 이상", check: (ctx) => ctx.itemsSpawned >= 5 },

      // 속도 이벤트
      { id: "e_speed_change", title: "속도 변화를 견뎌라 (Expert)", desc: "Expert에서 속도 이벤트 1회 이상 발생", conditionText: "한 판에서 속도 이벤트 1회 이상", check: (ctx) => ctx.speedEvents >= 1 },
      { id: "e_speed_change_3", title: "속도 이벤트 3회 (Expert)", desc: "Expert에서 속도 이벤트 3회 이상 발생", conditionText: "한 판에서 속도 이벤트 3회 이상", check: (ctx) => ctx.speedEvents >= 3 },

      // 아이템 타입별 "획득" (요구사항: 등장=획득)
      { id: "e_pick_bomb", title: "폭탄 획득 (Expert)", desc: "Expert에서 폭탄 아이템을 1회 이상 획득", conditionText: "한 판에서 폭탄 획득 1회 이상", check: (ctx) => (ctx.picked?.bomb || 0) >= 1 },
      { id: "e_pick_bomb_3", title: "폭탄 수집가 (Expert)", desc: "Expert에서 폭탄 아이템을 3회 이상 획득", conditionText: "한 판에서 폭탄 획득 3회 이상", check: (ctx) => (ctx.picked?.bomb || 0) >= 3 },

      { id: "e_pick_superbomb", title: "특수 폭탄 획득 (Expert)", desc: "Expert에서 특수 폭탄을 1회 이상 획득", conditionText: "한 판에서 특수 폭탄 획득 1회 이상", check: (ctx) => (ctx.picked?.superbomb || 0) >= 1 },
      { id: "e_pick_shrink", title: "몸집 줄이기 (Expert)", desc: "Expert에서 길이 축소 아이템을 1회 이상 획득", conditionText: "한 판에서 길이 축소 획득 1회 이상", check: (ctx) => (ctx.picked?.shrink || 0) >= 1 },
      { id: "e_pick_teleport", title: "순간이동 (Expert)", desc: "Expert에서 텔레포트 아이템을 1회 이상 획득", conditionText: "한 판에서 텔레포트 획득 1회 이상", check: (ctx) => (ctx.picked?.teleport || 0) >= 1 },
      { id: "e_pick_phase", title: "차원이동 개시 (Expert)", desc: "Expert에서 차원이동 아이템을 1회 이상 획득", conditionText: "한 판에서 차원이동 획득 1회 이상", check: (ctx) => (ctx.picked?.phase || 0) >= 1 },

      // 차원이동 성공(출구 도달)
      { id: "e_phase_success", title: "차원이동 성공 (Expert)", desc: "Expert에서 차원이동 상태에서 출구까지 도달해 성공", conditionText: "한 판에서 차원이동 성공 1회 이상", check: (ctx) => (ctx.phaseSuccess || 0) >= 1 },
      { id: "e_phase_success_2", title: "차원이동 마스터 (Expert)", desc: "Expert에서 차원이동 성공 2회 이상", conditionText: "한 판에서 차원이동 성공 2회 이상", check: (ctx) => (ctx.phaseSuccess || 0) >= 2 },

      // 조합형(기존 카운터만 사용)
      { id: "e_combo_score25_item3", title: "위험 속 생존 (Expert)", desc: "25점 이상 + 아이템 3회 이상 등장", conditionText: "한 판에서 점수 25점 이상 & 아이템 등장 3회 이상", check: (ctx) => (ctx.score >= 25 && ctx.itemsSpawned >= 3) },
      { id: "e_combo_score25_speed1", title: "가속에도 흔들림 없이 (Expert)", desc: "25점 이상 + 속도 이벤트 1회 이상", conditionText: "한 판에서 점수 25점 이상 & 속도 이벤트 1회 이상", check: (ctx) => (ctx.score >= 25 && ctx.speedEvents >= 1) }
    ]
  };

  // -----------------------------
  // 저장 / 로드
  // -----------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      const s = parsed || {};
      if (!s.unlocked) s.unlocked = {};
      if (!s.unlocked.classic) s.unlocked.classic = {};
      if (!s.unlocked.expert) s.unlocked.expert = {};

      if (!s.unlockedAt) s.unlockedAt = {};
      if (!s.unlockedAt.classic) s.unlockedAt.classic = {};
      if (!s.unlockedAt.expert) s.unlockedAt.expert = {};

      return s;
    } catch (e) {
      return {
        unlocked: { classic: {}, expert: {} },
        unlockedAt: { classic: {}, expert: {} }
      };
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // -----------------------------
  // 런타임(한 판) 컨텍스트
  // -----------------------------
  let runCtx = null;
  let onUnlockCallback = null;

  function beginRun(mode) {
    runCtx = {
      mode,
      score: 0,

      // Expert 전용 카운터
      itemsSpawned: 0,
      speedEvents: 0,

      // Expert 아이템 "획득" 카운터
      // - 요구사항: "등장"을 "획득"으로 간주하므로, 여기 카운트는 등장 콜백을 통해 증가한다.
      picked: { bomb: 0, superbomb: 0, shrink: 0, teleport: 0, phase: 0 },

      // Expert 차원이동 "성공"(출구 도달) 카운터
      phaseSuccess: 0
    };
  }

  function ensureRun(mode) {
    if (!runCtx || runCtx.mode !== mode) beginRun(mode);
  }

  function snapshot() {
    return runCtx ? { ...runCtx, picked: { ...(runCtx.picked || {}) } } : null;
  }

  // -----------------------------
  // 업적 판정 / 해금
  // -----------------------------
  function isUnlocked(mode, id, state) {
    const st = state || loadState();
    return !!(st.unlocked?.[mode]?.[id]);
  }

  function unlock(mode, id) {
    const state = loadState();
    if (isUnlocked(mode, id, state)) return false;

    state.unlocked[mode][id] = true;
    state.unlockedAt[mode][id] = Date.now();
    saveState(state);

    if (typeof onUnlockCallback === "function") {
      try { onUnlockCallback({ mode, id }); } catch (_) {}
    }
    return true;
  }

  function evaluateAll(mode) {
    const ctx = snapshot();
    if (!ctx) return;

    const defs = DEFINITIONS[mode] || [];
    for (const def of defs) {
      if (isUnlocked(mode, def.id)) continue;
      let ok = false;
      try { ok = !!def.check(ctx); } catch (_) { ok = false; }
      if (ok) unlock(mode, def.id);
    }
  }

  // -----------------------------
  // public
  // -----------------------------
  function getDefinitions(mode) {
    return (DEFINITIONS[mode] || []).map(d => ({ ...d }));
  }

  function getState() {
    return loadState();
  }

  function setOnUnlock(fn) {
    onUnlockCallback = fn;
  }

  // -----------------------------
  // game hooks
  // -----------------------------
  function onRunStart(mode) {
    beginRun(mode);
    evaluateAll(mode);
  }

  function onAppleEaten(mode, newScore) {
    ensureRun(mode);
    runCtx.score = (typeof newScore === "number") ? newScore : (runCtx.score + 1);
    evaluateAll(mode);
  }

  function onItemSpawned(mode) {
    ensureRun(mode);
    runCtx.itemsSpawned += 1;
    evaluateAll(mode);
  }

  function onItemPicked(mode, itemType) {
    ensureRun(mode);
    if (!runCtx.picked) runCtx.picked = { bomb: 0, superbomb: 0, shrink: 0, teleport: 0, phase: 0 };

    if (itemType === "bomb") runCtx.picked.bomb += 1;
    else if (itemType === "superbomb") runCtx.picked.superbomb += 1;
    else if (itemType === "shrink") runCtx.picked.shrink += 1;
    else if (itemType === "teleport") runCtx.picked.teleport += 1;
    else if (itemType === "phase") runCtx.picked.phase += 1;

    evaluateAll(mode);
  }

  function onPhaseSuccess(mode) {
    ensureRun(mode);
    runCtx.phaseSuccess = (runCtx.phaseSuccess || 0) + 1;
    evaluateAll(mode);
  }

  function onSpeedEvent(mode) {
    ensureRun(mode);
    runCtx.speedEvents += 1;
    evaluateAll(mode);
  }

  function onRunEnd(mode, finalScore) {
    ensureRun(mode);
    if (typeof finalScore === "number") runCtx.score = finalScore;
    evaluateAll(mode);
  }

  global.Achievements = {
    STORAGE_KEY,
    DEFINITIONS,
    getDefinitions,
    getState,
    clearAll,
    isUnlocked: (mode, id) => isUnlocked(mode, id),
    setOnUnlock,

    onRunStart,
    onAppleEaten,
    onItemSpawned,
    onItemPicked,
    onPhaseSuccess,
    onSpeedEvent,
    onRunEnd
  };
})(window);
