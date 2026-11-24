/* ArchiMate canvas prototype — vanilla JS
 * Left: floating (non-modal) AI chat · Center: architecture canvas · Right: setup guide tabs
 */
(() => {
  // ---------- Service catalog ----------
  const CAT = {
    compute:    { c: '#ED7100', label: 'compute' },
    storage:    { c: '#7AA116', label: 'storage' },
    networking: { c: '#8C4FFF', label: 'networking' },
    security:   { c: '#DD344C', label: 'security' },
    messaging:  { c: '#E7157B', label: 'messaging' },
    database:   { c: '#C925D1', label: 'database' },
    media:      { c: '#ED7100', label: 'media' },
    ml:         { c: '#01A88D', label: 'machine_learning' },
    mgmt:       { c: '#E7157B', label: 'management' },
    general:    { c: '#5A6B86', label: 'actor' },
  };

  const ICON = {
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2.5 5 6"/>',
    lambda: '<path d="M6 21l6-11M9 3h3l7 18"/>',
    bucket: '<path d="M4 6l2 14h12l2-14"/><ellipse cx="12" cy="6" rx="8" ry="2.5"/>',
    queue: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 7v10M12 7v10M16 7v10"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3"/>',
    api: '<path d="M8 4H5v16h3M16 4h3v16h-3M10 12h4"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    bell: '<path d="M4 12h3l5-6v12l-5-6M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    bus: '<path d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="3"/><circle cx="4" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    cdn: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    dns: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',
    lb: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12L5 17M12 12v5M12 12l7 5"/>',
    container: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    nat: '<path d="M4 8h12M12 4l4 4-4 4M20 16H8M12 12l-4 4 4 4"/>',
    cache: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  };

  // 백엔드 계약의 serviceType 21종 (docs/frontend-api-list/B-designs.md)
  const TYPES = {
    users:           { name: 'Users', cat: 'general', icon: 'users', role: '서비스를 사용하는 최종 사용자입니다.' },
    lambda:          { name: 'AWS Lambda', cat: 'compute', icon: 'lambda', role: '이벤트가 있을 때만 실행되는 서버리스 함수입니다.' },
    ec2:             { name: 'Amazon EC2', cat: 'compute', icon: 'server', role: '직접 관리하는 가상 서버입니다.' },
    ecs_fargate:     { name: 'Amazon ECS Fargate', cat: 'compute', icon: 'container', role: '서버 관리 없이 컨테이너를 실행합니다.' },
    s3:              { name: 'Amazon S3', cat: 'storage', icon: 'bucket', role: '파일과 정적 웹 화면을 저장하는 객체 스토리지입니다.' },
    dynamodb:        { name: 'Amazon DynamoDB', cat: 'database', icon: 'db', role: '키로 빠르게 읽고 쓰는 NoSQL 데이터베이스입니다.' },
    rds:             { name: 'Amazon RDS', cat: 'database', icon: 'db', role: 'SQL을 쓰는 관리형 관계형 데이터베이스입니다.' },
    elasticache:     { name: 'Amazon ElastiCache', cat: 'database', icon: 'cache', role: '자주 읽는 데이터를 메모리에 두는 캐시입니다.' },
    cloudfront:      { name: 'Amazon CloudFront', cat: 'networking', icon: 'cdn', role: '정적 파일을 전 세계 엣지에서 빠르게 전달하는 CDN입니다.' },
    api_gateway:     { name: 'Amazon API Gateway', cat: 'networking', icon: 'api', role: 'API 요청을 받아 백엔드로 전달하는 입구입니다.' },
    alb:             { name: 'Application Load Balancer', cat: 'networking', icon: 'lb', role: '요청을 여러 서버나 컨테이너로 나눠 줍니다.' },
    nat_gateway:     { name: 'NAT Gateway', cat: 'networking', icon: 'nat', role: '프라이빗 서브넷에서 인터넷으로 나가는 통로입니다.' },
    route53:         { name: 'Amazon Route 53', cat: 'networking', icon: 'dns', role: '도메인 DNS를 관리합니다.' },
    cognito:         { name: 'Amazon Cognito', cat: 'security', icon: 'id', role: '회원가입과 로그인을 처리합니다.' },
    secrets_manager: { name: 'AWS Secrets Manager', cat: 'security', icon: 'key', role: '비밀번호와 API 키를 안전하게 보관합니다.' },
    sqs:             { name: 'Amazon SQS', cat: 'messaging', icon: 'queue', role: '작업을 줄 세워 안정적으로 처리하게 합니다.' },
    sns:             { name: 'Amazon SNS', cat: 'messaging', icon: 'bell', role: '알림과 이벤트를 여러 곳에 전달합니다.' },
    eventbridge:     { name: 'Amazon EventBridge', cat: 'messaging', icon: 'bus', role: '이벤트를 규칙에 따라 다른 서비스로 보냅니다.' },
    ses:             { name: 'Amazon SES', cat: 'messaging', icon: 'mail', role: '이메일을 보냅니다.' },
    cloudwatch:      { name: 'Amazon CloudWatch', cat: 'mgmt', icon: 'chart', role: '로그, 지표, 알람으로 서비스 상태를 지켜봅니다.' },
    bedrock:         { name: 'Amazon Bedrock', cat: 'ml', icon: 'spark', role: '생성형 AI 모델을 API로 사용합니다.' },
  };

  // 직접 구성하는 캔버스에서 노드 이름으로 쓰는 한글 이름
  const KO = {
    users: '사용자', lambda: '서버리스 함수', ec2: '가상 서버', ecs_fargate: '컨테이너', s3: '파일 저장소', dynamodb: 'NoSQL DB',
    rds: '관계형 DB', elasticache: '캐시', cloudfront: 'CDN', api_gateway: 'API 입구', alb: '로드밸런서', nat_gateway: 'NAT 게이트웨이',
    route53: '도메인(DNS)', cognito: '회원 인증', secrets_manager: '비밀 보관', sqs: '작업 대기열', sns: '알림 발행',
    eventbridge: '이벤트 버스', ses: '이메일 발송', cloudwatch: '로그·알람', bedrock: '생성형 AI',
  };

  // ---------- 3안 (백엔드 DesignJob) ----------
  const TIER_ORDER = ['minimal_cost', 'balanced', 'scalable'];
  const TIER_LABEL = { minimal_cost: '최소비용형', balanced: '균형형', scalable: '확장형' };
  // 프론트는 서버 message를 그대로 보여 주지 않고 code별 문구로 바꾼다. (coding-conventions 8번)
  const ERROR_TEXT = {
    DESIGN_GENERATION_FAILED: '구성도를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    LLM_TIMEOUT: '생성이 오래 걸려서 멈췄어요. 다시 시도해 주세요.',
    RATE_LIMITED: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    INTERNAL_ERROR: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  };
  // ?state=partial-failed | failed 로 실패 화면을 확인한다. (기본: 3안 모두 성공)
  const MOCK_STATE = new URLSearchParams(location.search).get('state');
  let job = structuredClone(MOCK_STATE === 'failed' ? MOCK.failed : MOCK_STATE === 'partial-failed' ? MOCK.partialFailed : MOCK.completed);
  const fmtKRW = n => `${Number(n).toLocaleString('ko-KR')}원`;

  const NW = 96, NH = 76;
  let nodes = [], byId = {}, edges = [], groups = [], GUIDE = [], allSteps = [], checklists = [], current = null, isCustom = false;

  // 좌표가 없는 구성도를 자동 배치한다. x: 사용자에서 시작하는 흐름 순서, y: 그룹(리전·VPC·서브넷)별 띠
  function layoutArchitecture(arch) {
    const XGAP = 190, YGAP = 110, LANE_GAP = 96;
    const ns = arch.nodes, ids = ns.map(n => n.id);
    const layer = Object.fromEntries(ids.map(id => [id, 0]));
    for (let k = 0; k < ids.length; k++) {
      let changed = false;
      arch.edges.forEach(e => {
        if (layer[e.from] + 1 < ids.length && layer[e.to] < layer[e.from] + 1) { layer[e.to] = layer[e.from] + 1; changed = true; }
      });
      if (!changed) break;
    }
    // 그룹을 트리 순서로 늘어놓아 띠(lane) 순서를 정한다. 소속 없는 노드가 맨 위다.
    const order = [];
    const walk = pid => (arch.groups || []).filter(g => (g.parentId || null) === pid).forEach(g => { order.push(g.id); walk(g.id); });
    walk(null);
    const lanes = ['__out', ...order];
    const laneOf = n => (n.groupId && lanes.includes(n.groupId) ? n.groupId : '__out');
    const pos = {};
    let top = 0;
    lanes.forEach(l => {
      const members = ns.filter(n => laneOf(n) === l);
      if (!members.length) return;
      const byLayer = {};
      members.forEach(n => (byLayer[layer[n.id]] ||= []).push(n));
      const rows = Math.max(...Object.values(byLayer).map(a => a.length));
      Object.entries(byLayer).forEach(([lv, arr]) => arr.forEach((n, i) => {
        pos[n.id] = { x: Number(lv) * XGAP, y: top + ((rows - arr.length) / 2 + i) * YGAP };
      }));
      top += (rows - 1) * YGAP + NH + LANE_GAP;
    });
    return pos;
  }

  // 그룹 상자: 자기 노드와 하위 그룹 노드를 모두 감싼다. 안쪽 그룹일수록 여백이 작다.
  function buildGroups(gs, ns) {
    const kids = id => gs.filter(g => g.parentId === id);
    const ids = g => [...ns.filter(n => n.groupId === g.id).map(n => n.id), ...kids(g.id).flatMap(ids)];
    const height = g => { const k = kids(g.id).filter(c => ids(c).length); return k.length ? 1 + Math.max(...k.map(height)) : 0; };
    const depth = g => (g.parentId ? 1 + depth(gs.find(x => x.id === g.parentId)) : 0);
    return gs.map(g => ({ id: g.id, kind: g.kind, label: g.label, ids: ids(g), depth: depth(g), pad: 18 + 16 * height(g) }))
      .filter(g => g.ids.length).sort((a, b) => a.depth - b.depth);
  }

  // 3안 중 하나를 캔버스와 설정 가이드에 올린다.
  function loadDesign(d) {
    current = d;
    const arch = d.architecture, pos = layoutArchitecture(arch);
    nodes = arch.nodes.map(n => ({ id: n.id, type: n.serviceType, label: n.label, role: n.role, reason: n.reason, groupId: n.groupId, x: pos[n.id].x, y: pos[n.id].y }));
    byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    edges = arch.edges.map(e => [e.from, e.to, e.label || '']);
    groups = buildGroups(arch.groups || [], nodes);
    // 완료 체크 키: guide:{designId}:{stepId} (같은 stepId가 안마다 있을 수 있다)
    GUIDE = d.operationsGuide.phases.map(p => ({
      key: p.key, title: p.title, sub: p.sub, intro: p.intro,
      steps: p.steps.map(s => ({ id: `guide:${d.id}:${s.id}`, title: s.title, desc: s.desc, nodes: s.nodeIds, todo: s.todo, consolePath: s.consolePath, warn: s.warn })),
    }));
    checklists = d.operationsGuide.checklists || [];
    allSteps = GUIDE.flatMap(t => t.steps.map(s => ({ ...s, tab: t.key })));
  }
  function clearDesign() {
    current = null; nodes = []; byId = {}; edges = []; groups = []; GUIDE = []; allSteps = []; checklists = [];
  }

  // ---------- State ----------
  const state = {
    tx: 0, ty: 0, scale: 1,
    selected: null, focus: new Set(),
    tab: null, openStep: null,
    edit: false, deployed: false, link: false, linkFrom: null,
    done: new Set(),
  };
  try { JSON.parse(localStorage.getItem('archimate-done') || '[]').forEach(id => state.done.add(id)); } catch {}
  const saveDone = () => { try { localStorage.setItem('archimate-done', JSON.stringify([...state.done])); } catch {} };

  // ---------- DOM ----------
  const $ = s => document.querySelector(s);
  const canvas = $('#canvas'), world = $('#world'), nodesEl = $('#nodes'), edgesEl = $('#edges');
  const panelBody = $('#panelBody'), tabsEl = $('#tabs');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = icon => `<svg viewBox="0 0 24 24">${ICON[icon]}</svg>`;

  // ---------- Canvas render ----------
  function renderNodes() {
    nodesEl.innerHTML = '';
    groups.forEach(g => {
      const ns = g.ids.map(id => byId[id]).filter(Boolean);
      if (!ns.length) return;
      const pad = g.pad;
      const x1 = Math.min(...ns.map(n => n.x)) - pad, y1 = Math.min(...ns.map(n => n.y)) - pad;
      const x2 = Math.max(...ns.map(n => n.x + NW)) + pad, y2 = Math.max(...ns.map(n => n.y + NH)) + pad;
      const box = document.createElement('div');
      box.className = `group-box kind-${g.kind}`;
      Object.assign(box.style, { left: x1 + 'px', top: y1 + 'px', width: x2 - x1 + 'px', height: y2 - y1 + 'px' });
      box.innerHTML = `<span>${g.label}</span>`;
      nodesEl.appendChild(box);
    });
    nodes.forEach(n => {
      const t = TYPES[n.type], cat = CAT[t.cat];
      const el = document.createElement('div');
      el.className = 'node';
      el.dataset.id = n.id;
      el.style.cssText = `left:${n.x}px;top:${n.y}px;--c:${cat.c}`;
      el.title = n.role ? `${n.label} — ${n.role}` : n.label;
      el.innerHTML = `<div class="tile">${svg(t.icon)}</div><div class="name">${esc(n.label)}</div><div class="cat">${t.name}</div><i class="port"></i>`;
      nodesEl.appendChild(el);
      n.el = el;
    });
    paintHighlight();
  }

  function route(a, b) {
    const ac = { x: a.x + NW / 2, y: a.y + NH / 2 }, bc = { x: b.x + NW / 2, y: b.y + NH / 2 };
    const dx = bc.x - ac.x, dy = bc.y - ac.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sx = dx > 0 ? a.x + NW : a.x, tx = dx > 0 ? b.x : b.x + NW;
      const mx = Math.round((sx + tx) / 2);
      return `M${sx} ${ac.y}H${mx}V${bc.y}H${tx}`;
    }
    const sy = dy > 0 ? a.y + NH : a.y, ty = dy > 0 ? b.y : b.y + NH;
    const my = Math.round((sy + ty) / 2);
    return `M${ac.x} ${sy}V${my}H${bc.x}V${ty}`;
  }

  function renderEdges() {
    const f = state.focus, sel = state.selected;
    const hit = (a, b) => sel ? (a === sel || b === sel) : (f.has(a) && f.has(b));
    edgesEl.classList.toggle('dim', !!sel || f.size > 0);
    edgesEl.innerHTML = edges.filter(([a, b]) => byId[a] && byId[b]).map(([a, b, label]) => {
      const on = hit(a, b);
      return `<path${on ? ' class="hl"' : ''} d="${route(byId[a], byId[b])}"/>` + (label ? edgeLabel(byId[a], byId[b], label, on) : '');
    }).join('');
  }
  // 선 가운데 부분에 연결 설명(label)을 쓴다
  function edgeLabel(a, b, text, on) {
    const ac = { x: a.x + NW / 2, y: a.y + NH / 2 }, bc = { x: b.x + NW / 2, y: b.y + NH / 2 };
    const dx = bc.x - ac.x, dy = bc.y - ac.y;
    let x, y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sx = dx > 0 ? a.x + NW : a.x, tx = dx > 0 ? b.x : b.x + NW;
      x = Math.round((sx + tx) / 2); y = Math.abs(dy) > 14 ? (ac.y + bc.y) / 2 : ac.y - 5;
    } else { x = (ac.x + bc.x) / 2; y = Math.round(((dy > 0 ? a.y + NH : a.y) + (dy > 0 ? b.y : b.y + NH)) / 2); }
    return `<text class="edge-label${on ? ' hl' : ''}" x="${x}" y="${y}" text-anchor="middle">${esc(text)}</text>`;
  }

  function paintHighlight() {
    nodes.forEach(n => {
      n.el.classList.toggle('selected', n.id === state.selected);
      n.el.classList.toggle('focus', state.focus.has(n.id));
      n.el.classList.toggle('link-source', n.id === state.linkFrom);
      n.el.classList.toggle('deployed', state.deployed && n.type !== 'users');
    });
    nodesEl.classList.toggle('dim', state.focus.size > 0);
    renderEdges();
  }

  // ---------- Viewport ----------
  function applyView() {
    world.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
    const g = 16 * state.scale;
    canvas.style.backgroundSize = `${g}px ${g}px, 100% 100%`;
    canvas.style.backgroundPosition = `${state.tx}px ${state.ty}px, 0 0`;
  }
  function zoomAt(factor, cx, cy) {
    const ns = Math.min(3, Math.max(0.3, state.scale * factor)), k = ns / state.scale;
    state.tx = cx - (cx - state.tx) * k; state.ty = cy - (cy - state.ty) * k; state.scale = ns;
    applyView();
  }
  // 채팅 창이 넓어 캔버스가 좁아지면 상단 바의 배포 상태 칩을 숨긴다
  function updateTopbar() {
    const r = canvas.getBoundingClientRect(), chatEl = $('#chat');
    const docked = !chatEl.hidden && !chatEl.classList.contains('floating');
    document.querySelector('.topbar').classList.toggle('compact', r.width - (docked ? chatEl.offsetWidth : 0) - 48 < 560);
  }

  // 화면에 보이는 캔버스 영역 (채팅 창과 상단 바에 가려지는 부분 제외)
  function visibleBox() {
    const r = canvas.getBoundingClientRect(), chatEl = $('#chat');
    const left = !chatEl.hidden && r.width > 760 ? chatEl.offsetLeft + chatEl.offsetWidth + 8 : 0;
    const top = 76;
    return { left, top, w: r.width - left, h: r.height - top };
  }

  // 원 상태 복귀용 뷰 저장 / 부드러운 이동
  let animT;
  function animateTo(v) {
    canvas.classList.add('view-anim');
    state.tx = v.tx; state.ty = v.ty; state.scale = v.scale;
    applyView();
    clearTimeout(animT); animT = setTimeout(() => canvas.classList.remove('view-anim'), 520);
  }
  // 설정 단계에서 강조된 서비스로 확대 (처음 한 번만 현재 뷰를 저장)
  function zoomToFocus() {
    const ns = nodes.filter(n => state.focus.has(n.id));
    if (!ns.length) return;
    if (!state.homeView) state.homeView = { tx: state.tx, ty: state.ty, scale: state.scale };
    const { left, top, w, h } = visibleBox(), pad = 56, m = 24;
    const x1 = Math.min(...ns.map(n => n.x)) - pad, y1 = Math.min(...ns.map(n => n.y)) - pad;
    const x2 = Math.max(...ns.map(n => n.x + NW)) + pad, y2 = Math.max(...ns.map(n => n.y + NH)) + pad;
    const aw = w - m * 2, ah = h - m * 2;
    const scale = Math.min(aw / (x2 - x1), ah / (y2 - y1), 2.2);
    animateTo({
      scale,
      tx: left + m + (aw - (x2 - x1) * scale) / 2 - x1 * scale,
      ty: top + m + (ah - (y2 - y1) * scale) / 2 - y1 * scale,
    });
  }
  function restoreHome() {
    if (!state.homeView) return;
    const v = state.homeView; state.homeView = null;
    animateTo(v);
  }
  // 강조 서비스가 있으면 확대, 없으면 원래 뷰로 복귀
  const syncCamera = () => (state.focus.size ? zoomToFocus() : restoreHome());

  function fit() {
    state.homeView = null;
    if (!nodes.length) return;
    const r = canvas.getBoundingClientRect();
    const { left, top, w, h } = visibleBox();
    const x1 = Math.min(...nodes.map(n => n.x)) - 30, y1 = Math.min(...nodes.map(n => n.y)) - 40;
    const x2 = Math.max(...nodes.map(n => n.x + NW)) + 30, y2 = Math.max(...nodes.map(n => n.y + NH)) + 30;
    state.scale = Math.min(w / (x2 - x1), h / (y2 - y1), 1.6);
    state.tx = left + (w - (x2 - x1) * state.scale) / 2 - x1 * state.scale;
    state.ty = top + (h - (y2 - y1) * state.scale) / 2 - y1 * state.scale;
    applyView();
  }
  const center = () => { const r = canvas.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
  $('#zoomIn').onclick = () => zoomAt(1.2, ...center());
  $('#zoomOut').onclick = () => zoomAt(1 / 1.2, ...center());
  $('#zoomFit').onclick = fit;

  // ---------- Pointer: pan / drag / select ----------
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.target.closest('.topbar, .custom-tools, .zoom, .chat, .chat-fab')) return;
    canvas.classList.remove('view-anim');
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const n = byId[nodeEl.dataset.id];
      drag = { kind: 'node', n, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false };
    } else {
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: state.tx, oy: state.ty, moved: false };
      canvas.classList.add('panning');
    }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    movePresence(e);
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (drag.kind === 'pan') { state.tx = drag.ox + dx; state.ty = drag.oy + dy; applyView(); }
    else if (state.edit && drag.moved) {
      const n = drag.n;
      n.x = Math.round((drag.ox + dx / state.scale) / 8) * 8;
      n.y = Math.round((drag.oy + dy / state.scale) / 8) * 8;
      n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px';
      renderEdges();
    }
  });
  canvas.addEventListener('pointerup', () => {
    if (!drag) return;
    canvas.classList.remove('panning');
    if (!drag.moved) {
      if (drag.kind === 'node' && state.link) linkClick(drag.n.id);
      else { if (state.linkFrom) { state.linkFrom = null; paintHighlight(); } selectNode(drag.kind === 'node' ? drag.n.id : null); }
    } else if (drag.kind === 'node' && state.edit) { renderNodes(); syncCustom(); }
    drag = null;
  });
  canvas.addEventListener('wheel', e => {
    if (e.target.closest('.chat')) return;
    canvas.classList.remove('view-anim');
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  const presence = $('#presence');
  function movePresence(e) {
    const r = canvas.getBoundingClientRect();
    presence.style.left = e.clientX - r.left + 18 + 'px';
    presence.style.top = e.clientY - r.top + 18 + 'px';
  }

  // Node click → highlight + jump to its guide step + chat context
  function selectNode(id) {
    state.selected = id;
    state.focus = new Set();
    if (id) {
      const step = allSteps.find(s => s.nodes.includes(id));
      if (step) openStep(step.id, { fromNode: true });
      const t = TYPES[byId[id].type];
      $('#chatCtx').textContent = `컨텍스트: ${id} (${t.name})`;
    } else {
      state.openStep = null;
      $('#chatCtx').textContent = '컨텍스트: 전체 스택';
      renderGuide();
    }
    paintHighlight();
    syncCamera();
  }

  // ---------- Guide panel ----------
  function renderTabs() {
    tabsEl.style.gridTemplateColumns = `repeat(${Math.max(GUIDE.length, 1)}, 1fr)`;
    tabsEl.innerHTML = GUIDE.map(t => {
      const d = t.steps.filter(s => state.done.has(s.id)).length;
      return `<button class="tab${t.key === state.tab ? ' active' : ''}" data-tab="${t.key}">${t.title}<small>${t.sub} · ${d}/${t.steps.length}</small></button>`;
    }).join('');
    const total = allSteps.length, done = allSteps.filter(s => state.done.has(s.id)).length;
    $('#progBar').style.width = (total ? done / total * 100 : 0) + '%';
    $('#progText').textContent = `${done} / ${total} 완료`;
  }
  tabsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    state.tab = b.dataset.tab; state.openStep = null; state.focus = new Set(); state.selected = null;
    renderGuide(); paintHighlight(); syncCamera();
  });

  function renderGuide() {
    renderTabs();
    const tab = GUIDE.find(t => t.key === state.tab);
    if (!tab) {
      panelBody.innerHTML = isCustom
        ? '<div class="empty"><h4>직접 구성한 캔버스예요</h4>설정 가이드와 월 비용은 3안에서만 보여 드려요.<br>구성한 뒤 3안 비교에서 비슷한 안을 골라 보세요.</div>'
        : '<div class="empty"><h4>설정 가이드가 아직 없어요</h4>3안을 만들면 선택한 안의 설정 순서가 여기에 나와요.</div>';
      return;
    }
    const isLast = GUIDE[GUIDE.length - 1].key === tab.key;
    const lists = isLast && checklists.length ? `<div class="checklists">${checklists.map(c => `<section><h5>${esc(c.title)}</h5><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')}</div>` : '';
    panelBody.innerHTML = `<p class="tab-intro">${tab.intro}</p>` + tab.steps.map((s, i) => {
      const open = state.openStep === s.id, done = state.done.has(s.id);
      const chips = s.nodes.filter(id => byId[id]).map(id => `<span style="--c:${CAT[TYPES[byId[id].type].cat].c}"><i></i>${esc(byId[id].label)}</span>`).join('');
      return `<div class="step${open ? ' open' : ''}${done ? ' done' : ''}" data-step="${s.id}">
        <div class="step-head">
          <button class="check" data-check title="완료 표시">${done ? '✓' : i + 1}</button>
          <div><div class="step-title">${s.title}</div><div class="step-desc">${s.desc}</div><div class="step-svcs">${chips}</div></div>
          <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="step-body">
          ${s.warn ? `<div class="warn">⚠ ${s.warn}</div>` : ''}
          <ol>${s.todo.map(t => `<li>${t}</li>`).join('')}</ol>
          ${s.consolePath ? `<div class="console-path"><small>AWS 콘솔 경로</small><b>${esc(s.consolePath)}</b></div>` : ''}
          <div class="step-actions">
            <button class="btn btn-primary" data-check>${done ? '완료 취소' : '완료로 표시'}</button>
            <button class="btn btn-ghost" data-ask>AI에게 묻기</button>
          </div>
        </div>
      </div>`;
    }).join('') + lists;
    const openEl = panelBody.querySelector('.step.open');
    if (openEl) openEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  panelBody.addEventListener('click', e => {
    const stepEl = e.target.closest('.step'); if (!stepEl) return;
    const id = stepEl.dataset.step, step = allSteps.find(s => s.id === id);
    if (e.target.closest('[data-check]')) {
      state.done.has(id) ? state.done.delete(id) : state.done.add(id);
      saveDone(); renderGuide();
      if (state.done.has(id)) toast(`✓ ${step.title}`);
      return;
    }
    if (e.target.closest('[data-ask]')) { showChat(); ask(`"${step.title}" 단계 자세히 설명해줘`); return; }
    if (e.target.closest('.step-body')) return;
    state.openStep === id ? closeStep() : openStep(id);
  });

  function openStep(id, { fromNode = false } = {}) {
    const step = allSteps.find(s => s.id === id); if (!step) return;
    state.tab = step.tab; state.openStep = id;
    if (!fromNode) { state.selected = null; state.focus = new Set(step.nodes); }
    renderGuide(); paintHighlight(); syncCamera();
  }
  function closeStep() { state.openStep = null; state.focus = new Set(); renderGuide(); paintHighlight(); syncCamera(); }

  // ---------- AI chat (non-modal) ----------
  const chat = $('#chat'), log = $('#chatLog'), input = $('#chatText'), fab = $('#chatFab');

  function addMsg(who, html) {
    const m = document.createElement('div');
    m.className = `msg ${who}`;
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  const ref = id => { const s = allSteps.find(x => x.id === id); return s ? `<button class="ref" data-ref="${id}">↗ ${s.title}</button>` : ''; };
  log.addEventListener('click', e => { const b = e.target.closest('[data-ref]'); if (b) openStep(b.dataset.ref); });

  function greet() {
    log.innerHTML = ''; viewing = 'live';
    if (isCustom) { addMsg('ai', '직접 구성하는 캔버스예요. 설정 가이드와 월 비용은 3안에서 볼 수 있어요.'); return; }
    if (!current) { addMsg('ai', '아직 만들어진 안이 없어요. 상단 바에서 다시 시도해 주세요.'); return; }
    addMsg('ai', `안녕하세요! 지금 보는 안은 서비스 ${nodes.length}개, 설정 단계 ${allSteps.length}개로 구성돼 있어요.\n오른쪽 가이드를 따라가다 막히면 물어보세요. 캔버스에서 서비스를 클릭하면 그 서비스 기준으로 답해 드립니다.\n\n먼저 시작할 단계: ${ref(nextStep()?.id)}`);
  }
  const nextStep = () => allSteps.find(s => !state.done.has(s.id));

  function reply(q) {
    const lc = q.toLowerCase();
    const sel = state.selected && byId[state.selected];
    if (isCustom) return `직접 구성한 캔버스예요. 서비스 ${nodes.length}개, 연결 ${edges.length}개예요.\n설정 가이드와 월 비용은 3안에서 볼 수 있어요. 상단 바의 "3안 비교"를 눌러 보세요.`;
    if (!current) return '아직 만들어진 안이 없어요. 상단 바에서 3안을 다시 만들어 주세요.';

    if (/비용|가격|cost|price|요금/.test(lc)) {
      const mc = current.monthlyCost;
      if (!mc) return '이 안은 월 비용을 계산하지 못했어요. 잠시 후 다시 시도해 주세요.';
      const top = mc.items.filter(i => i.amount).sort((a, b) => b.amount - a.amount).slice(0, 3);
      return `이 안의 월 예상 비용은 약 <b>${fmtKRW(mc.total)}</b>이에요. (≈ $${mc.totalUsd})\n${top.map(i => `• ${byId[i.nodeId]?.label || i.nodeId} — ${fmtKRW(i.amount)}`).join('\n')}\n\n${mc.overBudget ? '월 예산을 넘어요.' : '월 예산 안이에요.'} ${mc.freeTierNote}`;
    }
    if (/장점|단점|비교|pros|cons/.test(lc)) {
      return `<b>${current.title}</b>\n장점\n${current.pros.map(x => `• ${esc(x)}`).join('\n')}\n\n단점\n${current.cons.map(x => `• ${esc(x)}`).join('\n')}`;
    }
    if (/다음|뭘|무엇|next|어디/.test(lc)) {
      const s = nextStep();
      if (!s) return '모든 단계를 완료했어요 🎉 CloudWatch 알람이 잘 오는지 확인해 보세요.';
      openStep(s.id);
      return `다음은 <b>${GUIDE.find(t => t.key === s.tab).title}</b> 단계의 "${s.title}"예요.\n${s.desc}\n\n관련 서비스를 캔버스에서 강조해 뒀어요. ${ref(s.id)}`;
    }
    const m = q.match(/"(.+?)"/);
    const stepByTitle = m && allSteps.find(s => s.title === m[1]);
    if (stepByTitle) {
      return `<b>${stepByTitle.title}</b>\n${stepByTitle.desc}\n\n${stepByTitle.todo.map((t, i) => `${i + 1}. ${t}`).join('\n')}${stepByTitle.warn ? `\n\n⚠ ${stepByTitle.warn}` : ''}${stepByTitle.consolePath ? `\n\n콘솔 경로: ${stepByTitle.consolePath}` : ''}\n\n${ref(stepByTitle.id)}`;
    }
    const key = Object.keys(TYPES).find(k => lc.includes(k.replace('_', ' ')) || lc.includes(TYPES[k].name.toLowerCase().replace(/^(amazon|aws) /, '')));
    const target = key ? nodes.find(n => n.type === key) : sel;
    if (target) {
      const t = TYPES[target.type];
      const steps = allSteps.filter(s => s.nodes.includes(target.id));
      const ins = edges.filter(e => e[1] === target.id).map(e => byId[e[0]]?.label);
      const outs = edges.filter(e => e[0] === target.id).map(e => byId[e[1]]?.label);
      return `<b>${esc(target.label)}</b> (${t.name})\n${esc(target.role || t.role)}\n${target.reason ? `\n왜 이 서비스인가요?\n${esc(target.reason)}\n` : ''}\n• 들어오는 연결: ${ins.join(', ') || '—'}\n• 나가는 연결: ${outs.join(', ') || '—'}\n\n관련 설정 단계:\n${steps.map(s => ref(s.id)).join('') || '—'}`;
    }
    if (/구조|아키텍처|설명|흐름|architecture|요약/.test(lc)) return esc(current.summary);
    return `"${esc(q)}"에 대해서는 프로토타입이라 아직 답을 준비하지 못했어요.\n이런 걸 물어보세요:\n• 다음에 뭘 설정해야 해?\n• 이 안의 장단점 알려줘\n• 월 예상 비용 알려줘`;
  }

  function ask(q) {
    if (!q.trim()) return;
    if (viewing !== 'live') openConversation('live');
    addMsg('me', esc(q));
    const typing = addMsg('ai typing', '<span></span><span></span><span></span>');
    setTimeout(() => { typing.remove(); addMsg('ai', reply(q)); }, 550 + Math.random() * 400);
  }

  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; input.style.height = ''; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chatForm').requestSubmit(); } });
  input.addEventListener('input', () => { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
  $('#suggests').addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
  // --- 대화 기록 삭제 (확인 모달) ---
  const confirmModal = $('#confirmModal');
  $('#chatClear').onclick = () => { closeHistory(); confirmModal.hidden = false; $('#confirmCancel').focus(); };
  $('#confirmCancel').onclick = () => { confirmModal.hidden = true; };
  confirmModal.onclick = e => { if (e.target === confirmModal) confirmModal.hidden = true; };
  $('#confirmOk').onclick = () => { confirmModal.hidden = true; liveHTML = null; greet(); toast('대화 기록을 삭제했어요'); };

  // --- 대화 기록 리스트 (목 데이터) ---
  const CHAT_HISTORY = [
    { id: 'h1', title: 'RDS와 DynamoDB 차이 문의', when: '오늘 14:20', msgs: [
      ['me', 'RDS와 DynamoDB 중에 뭐가 나아요?'],
      ['ai', '<b>DynamoDB</b>는 사용한 만큼만 내서 최소비용안에 맞고, <b>RDS</b>는 SQL을 쓸 수 있지만 켜 두는 동안 고정 비용이 나와요.'] ] },
    { id: 'h2', title: '월 예상 비용 확인', when: '어제 18:05', msgs: [
      ['me', '월 예상 비용 알려줘'],
      ['ai', '이 안의 월 예상 비용은 약 <b>1,147원</b>이에요.\n월 예산 안이에요.'] ] },
    { id: 'h3', title: 'Cognito가 왜 필요한가요?', when: '11월 21일', msgs: [
      ['me', 'Cognito는 꼭 써야 해요?'],
      ['ai', '로그인을 직접 만들지 않아도 돼서 균형형에서 추천해요. 최소비용안은 로그인이 없다면 빼도 돼요.'] ] },
  ];
  const histEl = $('#chatHistory'), histBtn = $('#chatHistoryBtn');
  let liveHTML = null, viewing = 'live';
  function renderHistory() {
    histEl.innerHTML = '<h5>대화 기록</h5>' +
      `<button data-h="live" class="${viewing === 'live' ? 'current' : ''}"><b>현재 대화</b><small>지금 진행 중</small></button>` +
      CHAT_HISTORY.map(h => `<button data-h="${h.id}" class="${viewing === h.id ? 'current' : ''}"><b>${h.title}</b><small>${h.when}</small></button>`).join('');
  }
  function closeHistory() { histEl.hidden = true; histBtn.classList.remove('on'); histBtn.setAttribute('aria-expanded', 'false'); }
  histBtn.onclick = e => {
    e.stopPropagation();
    if (!histEl.hidden) return closeHistory();
    renderHistory(); histEl.hidden = false; histBtn.classList.add('on'); histBtn.setAttribute('aria-expanded', 'true');
  };
  histEl.onclick = e => {
    e.stopPropagation();
    const b = e.target.closest('[data-h]'); if (!b) return;
    openConversation(b.dataset.h); closeHistory();
  };
  document.addEventListener('click', e => { if (!e.target.closest('#chatHistory')) closeHistory(); });
  function openConversation(id) {
    if (id === viewing) return;
    if (viewing === 'live') liveHTML = log.innerHTML;
    if (id === 'live') { if (liveHTML !== null) log.innerHTML = liveHTML; else greet(); }
    else {
      const h = CHAT_HISTORY.find(x => x.id === id);
      log.innerHTML = '';
      h.msgs.forEach(([who, text]) => addMsg(who, who === 'me' ? esc(text) : text));
    }
    viewing = id; log.scrollTop = log.scrollHeight;
  }

  function showChat() { chat.hidden = false; fab.hidden = true; updateTopbar(); }
  $('#chatClose').onclick = () => { closeHistory(); chat.hidden = true; fab.hidden = false; updateTopbar(); };
  fab.onclick = () => { showChat(); input.focus(); };

  // --- 폭 조절 (모서리 끌기, 더블클릭: 기본 폭) ---
  const rootEl = document.documentElement;
  const appEl = document.querySelector('.app');
  const WIDTH = { chat: { min: 340, max: 0.40, key: 'archimate-chat-w', css: '--chat-w' },
                  guide: { min: 380, max: 0.45, key: 'archimate-guide-w', css: '--guide-w' } };
  const narrow = () => matchMedia('(max-width: 760px)').matches;
  const guideWidth = () => appEl.classList.contains('guide-closed') ? 0 : document.querySelector('.panel').offsetWidth;
  const chatWidth = () => chat.hidden ? 0 : chat.offsetWidth;
  function limits(kind) {
    const W = innerWidth, c = WIDTH[kind];
    const other = kind === 'chat' ? guideWidth() : chatWidth();
    return [c.min, Math.max(c.min, Math.min(W * c.max, W * 0.70 - other))];
  }
  const clampW = (kind, w) => { const [lo, hi] = limits(kind); return Math.round(Math.min(hi, Math.max(lo, w))); };
  function setWidth(kind, w) { rootEl.style.setProperty(WIDTH[kind].css, w + 'px'); }
  function resetWidth(kind) {
    rootEl.style.removeProperty(WIDTH[kind].css);
    try { localStorage.removeItem(WIDTH[kind].key); } catch {}
  }
  function restoreWidths() {
    if (narrow()) return;
    ['chat', 'guide'].forEach(kind => {
      let v = null;
      try { v = parseFloat(localStorage.getItem(WIDTH[kind].key)); } catch {}
      if (Number.isFinite(v)) setWidth(kind, clampW(kind, v));
    });
  }
  function bindGrip(gripEl, kind, dir) {
    const getStart = () => kind === 'chat' ? chat.offsetWidth : document.querySelector('.panel').offsetWidth;
    gripEl.addEventListener('pointerdown', e => {
      if (narrow() || e.button > 0) return;
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sw = getStart();
      let w = sw;
      gripEl.classList.add('active'); appEl.classList.add('resizing'); document.body.classList.add('resizing');
      const move = ev => { w = clampW(kind, sw + dir * (ev.clientX - sx)); setWidth(kind, w); };
      const up = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        gripEl.classList.remove('active'); appEl.classList.remove('resizing'); document.body.classList.remove('resizing');
        try { localStorage.setItem(WIDTH[kind].key, String(w)); } catch {}
        updateTopbar();
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    gripEl.addEventListener('dblclick', () => { resetWidth(kind); updateTopbar(); toast('기본 폭으로 되돌렸어요'); });
  }
  bindGrip($('#chatGrip'), 'chat', +1);    // 채팅 창: 오른쪽 모서리를 오른쪽으로 끌면 넓어짐
  bindGrip($('#guideGrip'), 'guide', -1);  // 설정 가이드: 왼쪽 모서리를 왼쪽으로 끌면 넓어짐
  restoreWidths();

  // --- 설정 가이드 패널 닫기/열기 ---
  const guideClose = $('#guideClose');
  guideClose.onclick = () => {
    const closed = appEl.classList.toggle('guide-closed');
    guideClose.title = guideClose.ariaLabel = closed ? '설정 가이드 열기' : '설정 가이드 닫기';
    setTimeout(updateTopbar, 280);
  };

  // drag chat window by its header (stays non-modal; canvas remains usable)
  $('#chatHead').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const cr = canvas.getBoundingClientRect(), r = chat.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    chat.classList.add('floating'); updateTopbar();
    const move = ev => {
      const x = Math.max(0, Math.min(ev.clientX - cr.left - ox, cr.width - r.width));
      const y = Math.max(0, Math.min(ev.clientY - cr.top - oy, cr.height - 120));
      chat.style.left = x + 'px'; chat.style.top = y + 'px';
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });

  // ---------- Top bar ----------
  const modeBtn = $('#modeToggle');
  function setEdit(on, quiet) {
    state.edit = on;
    canvas.classList.toggle('edit', on);
    modeBtn.classList.toggle('pill-warn', !on);
    modeBtn.classList.toggle('pill-edit', on);
    modeBtn.querySelector('span').textContent = on ? 'Editing' : 'View only';
    if (!quiet) toast(on ? 'Edit mode — 서비스를 드래그해 이동' : 'View only');
  }
  const toggleEdit = () => setEdit(!state.edit);
  modeBtn.onclick = toggleEdit;

  // ---------- 3안 선택 · 비교 · 실패 처리 ----------
  const menu = $('#stackMenu'), tierBtn = $('#stackSelect');
  // 탭(메뉴 항목)은 designs[]와 failures[]에 있는 tier로만 만든다. 3개를 가정하지 않는다.
  const tierEntries = () => TIER_ORDER.map(t => {
    const d = job.designs.find(x => x.tier === t);
    return d ? { tier: t, design: d } : job.failures.some(f => f.tier === t) ? { tier: t, failed: true } : null;
  }).filter(Boolean);
  const diffClass = d => `diff diff-${d.difficulty.level}`;
  const costLine = d => d.monthlyCost ? `월 ${fmtKRW(d.monthlyCost.total)}` : '비용 계산 불가';

  function renderTierMenu() {
    const cn = custom.nodes.length;
    const customRows = `<div class="menu-sep"></div>${cn ? `<button class="tier-item custom${isCustom ? ' current' : ''}" data-custom="open"><span class="tier-name">내 캔버스${isCustom ? '<i class="tier-check">✓</i>' : ''}</span><span class="tier-title">직접 구성 · 서비스 ${cn}개 · 연결 ${custom.edges.length}개</span></button>` : ''}<button class="tier-item new" data-custom="new"><span class="tier-name">＋ 새 캔버스 만들기</span><span class="tier-title">빈 캔버스에서 서비스를 직접 추가하고 연결해요</span></button>`;
    menu.innerHTML = tierEntries().map(e => {
      if (e.failed) return `<button class="tier-item failed" data-tier="${e.tier}"><span class="tier-name">${TIER_LABEL[e.tier]}</span><span class="tier-fail">⚠ 만들지 못했어요 · 눌러서 다시 시도</span></button>`;
      const d = e.design, cur = current && current.id === d.id;
      return `<button class="tier-item${cur ? ' current' : ''}" data-tier="${e.tier}" role="menuitemradio" aria-checked="${cur}">
        <span class="tier-name">${TIER_LABEL[e.tier]}${cur ? '<i class="tier-check">✓</i>' : ''}</span>
        <span class="tier-title">${esc(d.title)}</span>
        <span class="tier-meta"><b>${costLine(d)}</b><span class="${diffClass(d)}">난이도 ${esc(d.difficulty.label)}</span>${d.monthlyCost?.overBudget ? '<span class="meta-pill over">예산 초과</span>' : ''}</span>
      </button>`;
    }).join('') + customRows;
  }

  function updateTierUI() {
    if (isCustom) {
      $('#stackName').textContent = '내 캔버스';
      $('#guideSub').textContent = `직접 구성 · 서비스 ${nodes.length}개 · 연결 ${edges.length}개`;
      $('#tierMeta').innerHTML = '';
      renderTierMenu();
      return;
    }
    $('#stackName').textContent = current ? TIER_LABEL[current.tier] : '안 없음';
    $('#guideSub').textContent = current ? `${current.title} · ap-northeast-2` : '3안을 만들지 못했어요';
    $('#tierMeta').innerHTML = current ? [
      `<span class="meta-pill"><b>${costLine(current)}</b></span>`,
      `<span class="meta-pill ${diffClass(current)}">난이도 ${esc(current.difficulty.label)}</span>`,
      current.monthlyCost?.freeTier ? '<span class="meta-pill ok">Free Tier 적용</span>' : '',
      current.monthlyCost?.overBudget ? '<span class="meta-pill over">예산 초과</span>' : '',
    ].join('') : '';
    renderTierMenu();
  }

  function showDesign(d, { announce = true } = {}) {
    if (isCustom) leaveCustom();
    state.selected = null; state.focus = new Set(); state.openStep = null; state.homeView = null; state.deployed = false;
    loadDesign(d);
    state.tab = GUIDE[0]?.key || null;
    $('#deployStatus').textContent = '배포 전'; $('#deployStatus').className = 'pill';
    $('#chatCtx').textContent = '컨텍스트: 전체 스택';
    updateTierUI(); renderNodes(); renderGuide(); fit();
    if (announce && viewing === 'live') addMsg('ai', `<b>${TIER_LABEL[d.tier]}</b> 안으로 바꿨어요. 서비스 ${nodes.length}개, 설정 단계 ${allSteps.length}개예요.`);
  }

  tierBtn.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  menu.onclick = e => {
    const c = e.target.closest('[data-custom]');
    if (c) {
      menu.hidden = true;
      if (c.dataset.custom === 'open') { if (!isCustom) openCustom(); }
      else if (custom.nodes.length) resetModal.hidden = false;
      else openCustom(true);
      return;
    }
    const b = e.target.closest('[data-tier]'); if (!b) return;
    menu.hidden = true;
    const en = tierEntries().find(x => x.tier === b.dataset.tier);
    if (!en) return;
    if (en.failed) openFail(en.tier);
    else if (!current || current.id !== en.design.id) showDesign(en.design);
  };

  // --- 3안 비교 표 ---
  const cmpModal = $('#compareModal');
  function renderCompare() {
    const es = tierEntries();
    const head = es.map(e => {
      if (e.failed) return `<th class="cmp-failed"><span class="tier-name">${TIER_LABEL[e.tier]}</span><p>만들지 못했어요</p><button class="btn" data-retry="${e.tier}">다시 시도</button></th>`;
      const cur = current && current.id === e.design.id;
      return `<th class="${cur ? 'current' : ''}"><span class="tier-name">${TIER_LABEL[e.tier]}</span><h4>${esc(e.design.title)}</h4>${cur ? '<span class="cur-badge">보고 있는 안</span>' : `<button class="btn btn-primary" data-pick="${e.tier}">이 안 선택</button>`}</th>`;
    }).join('');
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${es.map(e => e.failed ? '<td class="muted">—</td>' : `<td>${fn(e.design)}</td>`).join('')}</tr>`;
    const list = (a, tag = 'ul') => `<${tag}>${a.map(x => `<li>${esc(x)}</li>`).join('')}</${tag}>`;
    $('#compareBody').innerHTML = `<table class="cmp"><thead><tr><td></td>${head}</tr></thead><tbody>
      ${row('월 예상 비용', d => d.monthlyCost
        ? `<b class="cmp-cost">${fmtKRW(d.monthlyCost.total)}</b><small>≈ $${d.monthlyCost.totalUsd} · 환율 ${d.monthlyCost.exchangeRate.toLocaleString('ko-KR')}원 (${d.monthlyCost.exchangeRateDate})</small>${d.monthlyCost.overBudget ? '<em class="over">월 예산 초과</em>' : '<em class="within">월 예산 안</em>'}`
        : '비용을 계산하지 못했어요')}
      ${row('Free Tier', d => d.monthlyCost ? `${d.monthlyCost.freeTier ? '적용' : '적용 안 됨'}<small>${esc(d.monthlyCost.freeTierNote)}</small>` : '—')}
      ${row('운영 난이도', d => `<span class="${diffClass(d)}">${esc(d.difficulty.label)}</span><small>${esc(d.difficulty.reason)}</small>`)}
      ${row('한 줄 요약', d => esc(d.summary))}
      ${row('예산 설명', d => esc(d.budgetNote))}
      ${row('장점', d => list(d.pros))}
      ${row('단점', d => list(d.cons))}
      ${row('성장 로드맵', d => list(d.scalingPath, 'ol'))}
    </tbody></table>`;
  }
  $('#compareBtn').onclick = () => { renderCompare(); cmpModal.hidden = false; };
  cmpModal.onclick = e => {
    if (e.target === cmpModal || e.target.closest('[data-close]')) { cmpModal.hidden = true; return; }
    const pick = e.target.closest('[data-pick]'), retry = e.target.closest('[data-retry]');
    if (pick) { const d = job.designs.find(x => x.tier === pick.dataset.pick); cmpModal.hidden = true; if (d) showDesign(d); }
    if (retry) { cmpModal.hidden = true; openFail(retry.dataset.retry); }
  };

  // --- "만들지 못했어요" 모달 + 다시 시도 ---
  const failModal = $('#failModal'), failRetry = $('#failRetry');
  let failTier = null;
  function openFail(tier) {
    failTier = tier;
    const err = job.error;
    $('#failTitle').textContent = tier ? `${TIER_LABEL[tier]}은 만들지 못했어요` : '구성도를 만들지 못했어요';
    $('#failText').textContent = tier ? '이 안은 만들지 못했어요. 다시 시도해 주세요.' : (ERROR_TEXT[err?.code] || ERROR_TEXT.DESIGN_GENERATION_FAILED);
    failRetry.hidden = !tier && err && err.retryable === false;
    failRetry.disabled = false; failRetry.textContent = '다시 시도';
    failModal.hidden = false;
  }
  // 안별 재시도 API는 없고, 다시 시도는 POST /designs로 새로 생성한다. 프로토타입은 잠깐 기다린 뒤 성공으로 바꾼다.
  failRetry.onclick = () => {
    failRetry.disabled = true; failRetry.textContent = '다시 만드는 중…';
    setTimeout(() => {
      const t = failTier;
      if (t) {
        const d = structuredClone(MOCK.completed.designs.find(x => x.tier === t));
        job.designs.push(d); job.designs.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
        job.failures = job.failures.filter(f => f.tier !== t);
        failModal.hidden = true; showDesign(d); toast(`${TIER_LABEL[t]}을 만들었어요`);
      } else {
        job = structuredClone(MOCK.completed);
        failModal.hidden = true; showDesign(job.designs[0], { announce: false }); toast('3안을 만들었어요');
      }
    }, 1400);
  };
  failModal.onclick = e => { if ((e.target === failModal || e.target.closest('[data-close]')) && !failRetry.disabled) failModal.hidden = true; };

  // ---------- 새 캔버스 (직접 구성, 프로토타입 전용) ----------
  // 빈 캔버스에서 서비스를 직접 추가·연결한다. 백엔드 계약에 없는 기능이라 브라우저(localStorage)에만 저장하고, 하나만 유지한다.
  const CUSTOM_KEY = 'archimate-custom-canvas';
  const custom = { nodes: [], edges: [], seq: 0 };
  try { Object.assign(custom, JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}')); } catch {}
  const tools = $('#customTools'), palette = $('#svcPalette'), hint = $('#canvasHint'), linkBtn = $('#linkBtn');

  // 지금 캔버스 내용을 저장하고 화면의 개수 표시를 갱신한다.
  function syncCustom() {
    if (!isCustom) return;
    custom.nodes = nodes.map(({ id, type, label, x, y }) => ({ id, type, label, x, y }));
    custom.edges = edges.map(([a, b]) => [a, b]);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch {}
    hint.hidden = nodes.length > 0;
    updateTierUI();
  }

  function openCustom(fresh = false) {
    if (fresh) { custom.nodes = []; custom.edges = []; custom.seq = 0; }
    isCustom = true; current = null;
    state.selected = null; state.focus = new Set(); state.openStep = null; state.homeView = null; state.deployed = false; state.tab = null;
    nodes = custom.nodes.map(n => ({ ...n })); byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    edges = custom.edges.map(([a, b]) => [a, b, '']); groups = []; GUIDE = []; allSteps = []; checklists = [];
    $('#deployStatus').textContent = '배포 전'; $('#deployStatus').className = 'pill';
    $('#chatCtx').textContent = '컨텍스트: 전체 스택';
    tools.hidden = false; palette.hidden = true; setEdit(true, true);
    renderNodes(); setLink(false, true); renderGuide();
    if (nodes.length) fit(); else { state.scale = 1; state.tx = 0; state.ty = 0; applyView(); }
    syncCustom();
    if (viewing === 'live') addMsg('ai', nodes.length ? `<b>내 캔버스</b>로 바꿨어요. 서비스 ${nodes.length}개, 연결 ${edges.length}개예요.` : '새 캔버스를 만들었어요. 위쪽의 "서비스 추가"로 시작해 보세요.');
  }
  function leaveCustom() {
    isCustom = false; tools.hidden = true; palette.hidden = true; hint.hidden = true; state.link = false; state.linkFrom = null; canvas.classList.remove('linking'); linkBtn.classList.remove('on'); setEdit(false, true);
  }

  // --- 서비스 추가: 화면에 보이는 영역의 가운데에 놓는다 ---
  palette.innerHTML = Object.keys(TYPES).map(k => `<button data-svc="${k}" style="--c:${CAT[TYPES[k].cat].c}"><span class="tile">${svg(TYPES[k].icon)}</span><b>${KO[k]}</b><small>${TYPES[k].name}</small></button>`).join('');
  $('#addSvcBtn').onclick = () => { palette.hidden = !palette.hidden; };
  palette.onclick = e => { const b = e.target.closest('[data-svc]'); if (b) addService(b.dataset.svc); };
  document.addEventListener('click', e => { if (!e.target.closest('#svcPalette, #addSvcBtn')) palette.hidden = true; });
  function addService(type) {
    const { left, top, w, h } = visibleBox();
    const id = `n${++custom.seq}`;
    const cx = (left + w / 2 - state.tx) / state.scale - NW / 2, cy = (top + h / 2 - state.ty) / state.scale - NH / 2;
    // 화면 가운데에서 시작해 다른 서비스와 겹치지 않는 가장 가까운 빈자리를 찾는다
    const free = (x, y) => nodes.every(m => Math.abs(m.x - x) > NW + 20 || Math.abs(m.y - y) > NH + 20);
    let pos = { x: cx, y: cy };
    search: for (let r = 0; r < 8; r++) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx * (NW + 36), y = cy + dy * (NH + 36);
        if (free(x, y)) { pos = { x, y }; break search; }
      }
    }
    const n = { id, type, label: KO[type], x: Math.round(pos.x / 8) * 8, y: Math.round(pos.y / 8) * 8 };
    nodes.push(n); byId[id] = n;
    renderNodes(); selectNode(id); syncCustom();
  }

  // --- 연결: 출발 서비스, 도착 서비스를 차례로 누른다. 이미 연결된 두 서비스를 다시 이으면 끊는다 ---
  function setLink(on, quiet) {
    state.link = on; state.linkFrom = null;
    canvas.classList.toggle('linking', on); linkBtn.classList.toggle('on', on); linkBtn.setAttribute('aria-pressed', String(on));
    paintHighlight();
    if (on && !quiet) toast('출발 서비스를 누른 뒤 도착 서비스를 눌러 주세요');
  }
  linkBtn.onclick = () => setLink(!state.link);
  function linkClick(id) {
    if (!state.linkFrom) { state.linkFrom = id; paintHighlight(); toast('이제 도착 서비스를 눌러 주세요'); return; }
    const a = state.linkFrom, b = id;
    state.linkFrom = null;
    if (a !== b) {
      const i = edges.findIndex(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
      if (i >= 0) { edges.splice(i, 1); toast('연결을 끊었어요'); } else { edges.push([a, b, '']); toast('연결했어요'); }
      syncCustom();
    }
    paintHighlight();
  }

  // --- 삭제 ---
  function deleteSelected() {
    const id = state.selected; if (!id || !byId[id]) return;
    nodes.splice(nodes.findIndex(n => n.id === id), 1); delete byId[id];
    edges = edges.filter(([a, b]) => a !== id && b !== id);
    state.selected = null; renderNodes(); renderGuide(); syncCustom();
    toast('서비스를 지웠어요');
  }
  $('#delBtn').onclick = () => (state.selected ? deleteSelected() : toast('지울 서비스를 먼저 눌러 선택하세요'));

  // --- 새 캔버스 만들기 확인 ---
  const resetModal = $('#resetModal');
  $('#resetCancel').onclick = () => { resetModal.hidden = true; };
  resetModal.onclick = e => { if (e.target === resetModal) resetModal.hidden = true; };
  $('#resetOk').onclick = () => { resetModal.hidden = true; openCustom(true); toast('새 캔버스를 만들었어요'); };

  document.addEventListener('click', () => { menu.hidden = true; });
  $('#bellBtn').onclick = () => { $('#bellDot').hidden = true; toast(state.deployed ? 'Deployment completed successfully' : 'No new notifications'); };

  // ---------- Deploy ----------
  const deployBtn = $('#deployBtn'), status = $('#deployStatus');
  deployBtn.onclick = async () => {
    deployBtn.disabled = true; state.deployed = false; paintHighlight();
    const targets = nodes.filter(n => n.type !== 'users');
    status.className = 'pill';
    for (let i = 0; i < targets.length; i++) {
      status.textContent = `Deploying… ${i + 1}/${targets.length}`;
      targets[i].el.classList.add('deploying');
      await new Promise(r => setTimeout(r, 80));
      targets[i].el.classList.remove('deploying');
      targets[i].el.classList.add('deployed');
    }
    state.deployed = true;
    status.textContent = 'Stack deployed ✓'; status.className = 'pill ok';
    deployBtn.disabled = false; $('#bellDot').hidden = false;
    renderGuide();
    addMsg('ai', `배포가 완료됐어요 ✅ 리소스 ${targets.length}개가 생성되었습니다.\n이제 설정 가이드의 마지막 단계에서 알람을 확인해 보세요.`);
    showChat();
  };

  // ---------- Theme ----------
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('archimate-theme'); } catch {}
  root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeSwitch').onclick = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('archimate-theme', root.dataset.theme); } catch {}
  };

  // ---------- Shortcuts ----------
  const modal = $('#shortcutsModal');
  $('#shortcutsBtn').onclick = () => { modal.hidden = false; };
  modal.onclick = e => { if (e.target === modal || e.target.closest('[data-close]')) modal.hidden = true; };
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === '+' || e.key === '=') zoomAt(1.2, ...center());
    else if (e.key === '-') zoomAt(1 / 1.2, ...center());
    else if (e.key === '0') fit();
    else if (e.key.toLowerCase() === 'e') toggleEdit();
    else if (e.key === '/') { e.preventDefault(); showChat(); input.focus(); }
    else if (e.key === 'Escape') { if (state.linkFrom) { state.linkFrom = null; paintHighlight(); } palette.hidden = true; resetModal.hidden = true; selectNode(null); closeStep(); modal.hidden = true; confirmModal.hidden = true; cmpModal.hidden = true; if (!failRetry.disabled) failModal.hidden = true; closeHistory(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && state.edit && state.selected) deleteSelected();
  });

  // ---------- Toast ----------
  let tt;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- Init ----------
  const firstOk = tierEntries().find(e => !e.failed);
  if (firstOk) showDesign(firstOk.design, { announce: false });
  else { clearDesign(); state.tab = null; updateTierUI(); renderNodes(); renderGuide(); }
  greet(); fit(); updateTopbar();
  if (!firstOk) openFail(null);
  addEventListener('resize', () => { restoreWidths(); updateTopbar(); });
})();
