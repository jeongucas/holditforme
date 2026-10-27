const $ = (s) => document.getElementById(s);
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = Math.random;
const f = (n) => Math.round(n).toLocaleString();
const r5 = (x) => Math.round(x / 5) * 5;
const pc = (x) => Math.round(x * 100) + '%';

const L = [[25, 50], [50, 100], [75, 150], [100, 200], [150, 300], [200, 400], [300, 600], [400, 800], [600, 1200], [1000, 2000]];

const SU = '♠♥♦♣';
const NM = ['High card', 'Pair', 'Two pair', 'Trips', 'Straight', 'Flush', 'Full house', 'Quads', 'Straight flush'];
const K = 759375;

const STY = [
  { n: 'Rick', t: 'Tight-aggressive', o: 1.5, a: 0.6 },
  { n: 'Mad Mike', t: 'Loose-aggressive', o: -2.5, a: 0.9 },
  { n: 'Sally', t: 'Loose-passive (calls a lot)', o: -2, a: 0.15, call: 1 },
  { n: 'Nate', t: 'Tight-passive (nit)', o: 2, a: 0.3 },
  { n: 'Pat', t: 'Balanced regular', o: 0, a: 0.55 }
];

const POS = [[50, 88], [15, 70], [15, 26], [50, 9], [85, 26], [85, 70]];

let P, board, pot, cur, minR, nr, btn, hands, ST, stat, nxr, turn = -1;

const rk = (r) => (r == 10 ? '10' : '  23456789 JQKA'[r] || 'T');

const cd = (c) => {
  const s = (c / 13) | 0;
  return `<span class="cd${s == 1 || s == 2 ? ' r' : ''}">${rk(c % 13 + 2)}<br>${SU[s]}</span>`;
};

const lv = () => Math.min(9, (Math.max(hands, 1) - 1) / 10 | 0);

const log = (t, c = '') => {
  const l = $('log');
  l.insertAdjacentHTML('beforeend', `<div class="${c}">${t}</div>`);
  l.scrollTop = 1e9;
};

const pk = (c, k) => {
  let v = c;
  for (let i = 0; i < 5; i++) v = v * 15 + (k[i] || 0);
  return v;
};

function str(m) {
  for (let h = 14; h >= 5; h--) {
    let ok = 1;
    for (let k = 0; k < 5; k++) {
      const r = h - k;
      if (!(r == 1 ? m[14] : m[r])) {
        ok = 0;
        break;
      }
    }
    if (ok) return h;
  }
  return 0;
}

function ev(c) {
  const rc = new Array(15).fill(0);
  const sc = [0, 0, 0, 0];
  const by = [[], [], [], []];

  for (const x of c) {
    const r = x % 13 + 2;
    const s = x / 13 | 0;
    rc[r]++;
    sc[s]++;
    by[s].push(r);
  }

  const fs = sc.findIndex((n) => n >= 5);

  if (fs >= 0) {
    const m = [];
    by[fs].forEach((r) => (m[r] = 1));
    const h = str(m);
    if (h) return pk(8, [h]);
  }

  const q = [], t = [], p = [], s1 = [];

  for (let r = 14; r >= 2; r--) {
    const n = rc[r];
    if (n == 4) q.push(r);
    else if (n == 3) t.push(r);
    else if (n == 2) p.push(r);
    else if (n == 1) s1.push(r);
  }

  if (q.length) return pk(7, [q[0], [...t, ...p, ...s1].sort((a, b) => b - a)[0]]);

  if (t.length && (t.length > 1 || p.length)) return pk(6, [t[0], Math.max(t[1] || 0, p[0] || 0)]);

  if (fs >= 0) return pk(5, by[fs].sort((a, b) => b - a).slice(0, 5));

  const h = str(rc.map((n) => n > 0));
  if (h) return pk(4, [h]);

  if (t.length) return pk(3, [t[0], ...s1.slice(0, 2)]);

  if (p.length > 1) return pk(2, [p[0], p[1], [...p.slice(2), ...s1].sort((a, b) => b - a)[0]]);

  if (p.length) return pk(1, [p[0], ...s1.slice(0, 3)]);

  return pk(0, s1.slice(0, 5));
}

function equity(h, b, k, N) {
  const u = new Set([...h, ...b]);
  const rest = [];
  for (let i = 0; i < 52; i++) if (!u.has(i)) rest.push(i);

  const need = 5 - b.length;
  const m = need + 2 * k;
  let w = 0;

  for (let s = 0; s < N; s++) {
    for (let i = 0; i < m; i++) {
      const j = i + (rnd() * (rest.length - i) | 0);
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    const bd = b.concat(rest.slice(0, need));
    const me = ev(h.concat(bd));
    let win = 1,
      tie = 0;

    for (let o = 0; o < k; o++) {
      const v = ev([rest[need + 2 * o], rest[need + 2 * o + 1], ...bd]);
      if (v > me) {
        win = 0;
        break;
      }
      if (v == me) tie++;
    }

    w += win / (tie + 1);
  }

  return w / N;
}

function chen(h) {
  const [a, b] = h.map((x) => x % 13 + 2).sort((x, y) => y - x);
  const su = (h[0] / 13 | 0) == (h[1] / 13 | 0);
  const pt = (r) => (r == 14 ? 10 : r == 13 ? 8 : r == 12 ? 7 : r == 11 ? 6 : r / 2);

  let s = pt(a);
  if (a == b) return Math.ceil(Math.max(5, s * 2));

  if (su) s += 2;
  const g = a - b - 1;
  s -= g == 0 ? 0 : g == 1 ? 1 : g == 2 ? 2 : g == 3 ? 4 : 5;
  if (g < 2 && a < 12) s++;
  return Math.ceil(s);
}

function late(p) {
  const a = P.map((x, i) => i).filter((i) => !P[i].out);
  const n = a.length;
  const d = (a.indexOf(P.indexOf(p)) - a.indexOf(btn) + n) % n;

  return d == 0 ? 1 : d < 3 ? 0.25 : 0.3 + 0.5 * (d - 3) / Math.max(1, n - 4);
}

function decide(p, S, det) {
  const BB = L[lv()][1];
  const n = P.filter((x) => !x.out).length;
  const opp = P.filter((x) => !x.out && !x.fold).length - 1;

  const toCall = Math.min(cur - p.bet, p.stack);
  const bb = p.stack / BB;
  const lt = late(p);
  const R = () => det ? 0.5 : rnd();

  const AI = { a: 'raise', to: p.bet + p.stack };
  const CA = { a: 'call' };
  const FO = { a: 'fold' };
  const rs = (t) => (t >= p.bet + p.stack * 0.6 ? AI : { a: 'raise', to: r5(t) });
  const odds = toCall / (pot + toCall);

  let o, w, eq;
  const pre = !board.length;

  if (pre) {
    const c = chen(p.hole);
    const op = 8 - 3.5 * lt - (6 - n) * 0.8 + S.o;
    eq = c;

    if (!nr) {
      if (toCall == 0) {
        o = c >= 11 ? rs(3 * BB) : CA;
        w = o == CA ? 'Free check from the big blind.' : 'Premium hand: raise for value.';
      } else if (bb <= 12) {
        const t = 9 - 3 * lt - (12 - bb) * 0.4 + S.o * 0.5;
        o = c >= t ? AI : FO;
        w = o == AI ? `Short stack (${bb.toFixed(0)} BB): shove or fold, and this hand is strong enough to shove.` : `Short stack (${bb.toFixed(0)} BB): a hand score of ${c} is below the shove range (about ${Math.ceil(t)}) from this seat.`;
      } else if (c >= op) {
        o = S.call && c < 10 ? CA : rs(2.5 * BB);
        w = o == CA ? 'Limping: passive.' : 'Open-raise: this hand is in range for this position.';
      } else if (p.bet > 0 && toCall <= BB && c >= op - 2.5) {
        o = CA;
        w = 'Cheap to see a flop with a playable hand.';
      } else if (!det && R() < S.a * 0.1 * lt) {
        o = rs(2.5 * BB);
        w = 'Steal attempt.';
      } else {
        o = FO;
        w = `Hand score ${c} is under the ~${Math.ceil(op)} needed to open from this seat. Folding is correct.`;
      }
    } else {
      const x = toCall / BB;
      const pc2 = toCall >= p.stack * 0.4;

      let nd = 7.5 + Math.min(x, 12) * 0.4 - lt * 1.5 + S.o * 0.6 + 1.2 * (nr - 1);
      if (pc2) nd = Math.max(nd, 10);

      if ((nr == 1 && c >= 11.5) || c >= 15 || (nr == 1 && !det && c >= 8 && lt > 0.5 && R() < S.a * 0.12)) {
        o = bb <= 25 ? AI : rs(cur * (nr == 1 ? 3 : 2.4));
        w = 'Strong hand against a raise: re-raise for value.';
      } else if (c >= nd) {
        o = CA;
        w = `Good enough to call a raise of ${x.toFixed(1)} BB (need about ${Math.ceil(nd)}).`;
      } else {
        o = FO;
        w = `Not enough against a raise of ${x.toFixed(1)} BB (need about ${Math.ceil(nd)}, you have ${c}).`;
      }
    }
  } else {
    eq = equity(p.hole, board, opp, det ? 900 : 250);
    let e = eq;

    if (toCall > 0) e -= 0.05 + 0.1 * Math.min(1, toCall / pot);

    const vb = 0.66 - 0.08 * S.a;

    if (!toCall) {
      if (eq >= vb + 0.1) {
        o = rs(0.75 * pot);
        w = 'Very strong: bet big for value.';
      } else if (eq >= vb) {
        o = rs(0.5 * pot);
        w = 'Likely ahead: bet for value and to charge draws.';
      } else if (!det && opp < 3 && R() < S.a * 0.25 * (0.4 + lt * 0.6)) {
        o = rs(0.5 * pot);
        w = 'Bluff.';
      } else {
        o = CA;
        w = 'Not strong enough to bet for value: check and keep the pot small.';
      }
    } else if (e >= 0.74 && nr < 3) {
      o = rs(cur + 0.75 * (pot + toCall));
      w = 'Your equity is high even after adjusting for their bet: raise.';
    } else if (e >= odds + 0.03) {
      o = CA;
      w = `Equity beats the price: you need ${pc(odds)} and have about ${pc(eq)}. Calling is profitable.`;
    } else if (!det && nr < 2 && R() < S.a * 0.07) {
      o = rs(cur * 2.6);
      w = 'Bluff raise.';
    } else {
      o = FO;
      w = `You need ${pc(odds)} to call but only have about ${pc(eq)}, and bets usually mean a stronger range. Fold.`;
    }
  }

  return { ...o, w, eq, odds, opp, pre };
}

function put(p, a) {
  a = Math.min(a, p.stack);
  p.stack -= a;
  p.bet += a;
  p.tot += a;
  pot += a;
  if (!p.stack) p.allin = true;
}

function apply(p, d) {
  const toCall = Math.min(cur - p.bet, p.stack);
  p.acted = true;

  if (d.a == 'raise') {
    const to = Math.min(Math.max(d.to, cur + minR), p.bet + p.stack);

    if (to > cur) {
      const verb = cur ? 'Raise to' : 'Bet';
      const inc = to - cur;
      if (inc >= minR) minR = inc;
      cur = to;
      nr++;
      put(p, to - p.bet);
      P.forEach((q) => {
        if (q != p) q.acted = false;
      });
      p.act = p.allin ? `All-in ${f(to)}` : `${verb} ${f(to)}`;
      log(`${p.n}: ${p.act}`);
      return;
    }

    d = { a: 'call' };
  }

  if (d.a == 'fold' && !toCall) d = { a: 'call' };

  if (d.a == 'fold') {
    p.fold = true;
    p.act = 'Fold';
  } else {
    put(p, toCall);
    p.act = p.allin ? 'All-in' : toCall ? `Call ${f(toCall)}` : 'Check';
  }

  log(`${p.n}: ${p.act}`);
}

function grade(s, d) {
  const a = s.a;
  const k = (x) => (x.a == 'raise' ? 'r' : x.a == 'fold' ? 'f' : 'c');
  const tc = Math.min(cur - P[0].bet, P[0].stack);
  let m = '';

  stat.dec++;
  if (k(a) == k(d)) stat.agree++;

  if (!board.length) {
    if (d.a == 'raise' || (d.a == 'call' && tc > 0)) stat.vpip++;
    if (d.a == 'raise') stat.pfr++;

    if (d.a == 'fold' && a.a == 'raise' && tc > 0) m = 'You folded a hand strong enough to raise.';
  } else if (tc > 0) {
    if (d.a == 'fold' && a.eq - a.odds > 0.12) m = `You folded with about ${pc(a.eq)} equity when you only needed ${pc(a.odds)}.`;
    else if (d.a == 'call' && a.odds - a.eq > 0.12) m = `You called needing ${pc(a.odds)} with only about ${pc(a.eq)} equity.`;
  }

  if (m) {
    stat.miss++;
    log('⚠ ' + m, 'w');
  }
}

function human(p) {
  return new Promise((res) => {
    const a = decide(p, { o: 0, a: 0.55 }, true);
    const mx = p.bet + p.stack;
    const mn = Math.min(cur + minR, mx);
    const can = mx > cur;

    ST = { res, p, a };
    $('sl').min = mn;
    $('sl').max = mx;
    $('sl').value = Math.min(mx, Math.max(mn, a.to || mn));

    $('sz').style.display = can && mn < mx ? 'flex' : 'none';
    $('br').style.display = can ? '' : 'none';

    upd();
    draw();
    $('act').style.display = 'flex';
  });
}

function upd() {
  const v = +$('sl').value;
  const mx = P[0].bet + P[0].stack;
  $('br').textContent = v >= mx ? `All-in ${f(mx)}` : `${cur ? 'Raise to' : 'Bet'} ${f(v)}`;
}

function pre(k) {
  const p = P[0];
  const mx = p.bet + p.stack;
  $('sl').value = Math.min(mx, Math.max(+$('sl').min, r5(cur + k * (pot + Math.min(cur - p.bet, p.stack)))));
  upd();
}

function choose(d) {
  if (!ST) return;
  const s = ST;
  ST = null;
  $('act').style.display = 'none';
  grade(s, d);
  s.res(d);
}

$('bf').onclick = () => choose({ a: 'fold' });
$('bc').onclick = () => choose({ a: 'call' });
$('br').onclick = () => choose({ a: 'raise', to: +$('sl').value });
$('sl').oninput = upd;

$('nx').onclick = () => {
  $('nx').style.display = 'none';
  nxr && nxr();
};

onkeydown = (e) => {
  const k = e.key.toLowerCase();
  if (ST && k == 'f') $('bf').click();
  if (ST && k == 'c') $('bc').click();
  if (ST && k == 'r') $('br').click();
  if (k == ' ' && $('nx').style.display != 'none') {
    e.preventDefault();
    $('nx').click();
  }
};

async function act(p) {
  turn = P.indexOf(p);
  draw();
  let d;

  if (p.h) d = await human(p);
  else {
    await sl(P[0].fold || P[0].out ? 120 : 650);
    d = decide(p, p.S, false);
  }

  apply(p, d);
  turn = -1;
  draw();
}

async function round(i) {
  const live = P.filter((p) => !p.out && !p.fold);
  if (live.length < 2) return;

  const can = live.filter((p) => !p.allin);

  if (can.length < 2 && (!can[0] || can[0].bet >= cur)) return;

  if (!can.some((p) => !p.acted || p.bet < cur)) return;

  const p = P[i];

  if (!p.out && !p.fold && !p.allin && (!p.acted || p.bet < cur)) await act(p);

  return round((i + 1) % 6);
}

function settle() {
  const lvs = [...new Set(P.filter((p) => !p.fold && p.tot).map((p) => p.tot))].sort((a, b) => a - b);
  const W = new Map();
  let pv = 0;

  for (const T of lvs) {
    let amt = 0;
    P.forEach((p) => (amt += Math.max(0, Math.min(p.tot, T) - pv)));

    const el = P.filter((p) => !p.fold && p.tot >= T);
    const b = Math.max(...el.map((p) => p.sc));
    const w = el.filter((p) => p.sc == b);
    const sh = Math.floor(amt / w.length);

    w.forEach((p, j) => {
      const g = sh + (j ? 0 : amt - sh * w.length);
      p.stack += g;
      W.set(p, (W.get(p) || 0) + g);
    });
    pv = T;
  }

  return W;
}

async function hand() {
  hands++;
  stat.h++;
  const alive0 = P.filter((p) => !p.out).length;

  if (hands > 1 && (hands - 1) % 10 == 0) log(`Blinds up to ${L[lv()].map(f).join('/')}`, 'b');

  let al = P.map((p, i) => i).filter((i) => !P[i].out);
  btn = al.find((i) => i > btn) ?? al[0];

  const n = al.length;
  const bi = al.indexOf(btn);
  const ord = al.slice(bi).concat(al.slice(0, bi));
  const [SB, BB] = L[lv()];

  const deck = [...Array(52).keys()];
  for (let i = 51; i > 0; i--) {
    const j = rnd() * (i + 1) | 0;
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  board = [];
  pot = 0;
  nr = 0;
  if ($('msg')) $('msg').textContent = '';

  P.forEach((p) => {
    p.hole = p.out ? [] : [deck.pop(), deck.pop()];
    p.bet = p.tot = 0;
    p.fold = p.allin = p.acted = p.show = false;
    p.act = '';
    p.st0 = p.stack;
    p.sc = 0;
  });

  put(P[ord[n == 2 ? 0 : 1]], SB);
  put(P[ord[n == 2 ? 1 : 2]], BB);
  cur = BB;
  minR = BB;

  log(`— Hand ${hands}: you hold ${P[0].hole.map((c) => rk(c % 13 + 2) + SU[c / 13 | 0]).join(' ')}`, 'b');

  const street = async (st, first) => {
    if (st > 0) {
      board.push(...deck.splice(-(st == 1 ? 3 : 1)));
      P.forEach((p) => {
        p.bet = 0;
        p.acted = false;
        if (!p.fold) p.act = '';
      });
      cur = 0;
      minR = BB;
      nr = 0;

      log(`${['', 'Flop', 'Turn', 'River'][st]}: ${board.map((c) => rk(c % 13 + 2) + SU[c / 13 | 0]).join(' ')}`, 'b');
      draw();
      await sl(500);
    }

    await round(first);

    if (st < 3 && P.filter((p) => !p.out && !p.fold).length > 1) await street(st + 1, ord[1]);
  };

  draw();
  await street(0, ord[n == 2 ? 0 : 3 % n]);

  const live = P.filter((p) => !p.out && !p.fold);
  let msg;

  if (live.length == 1) {
    live[0].stack += pot;
    msg = `${live[0].n} wins ${f(pot)}`;
  } else {
    live.forEach((p) => {
      p.sc = ev(p.hole.concat(board));
      p.show = true;
    });

    msg = [...settle()].map(([p, a]) => `${p.n} wins ${f(a)} with ${NM[Math.floor(p.sc / K)]}`).join('; ');
  }

  pot = 0;
  turn = -1;
  log(msg, 'b');

  const bust = P.filter((p) => !p.out && !p.stack).sort((a, b) => a.st0 - b.st0);

  bust.forEach((p, i) => {
    p.out = 1;
    p.place = alive0 - i;
    log(`${p.n} is out in ${p.place}${sfx(p.place)} place.`, 'b');
  });

  draw();
  $('msg').textContent = msg;
}

const sfx = (n) => (n == 1 ? 'st' : n == 2 ? 'nd' : n == 3 ? 'rd' : 'th');

function draw() {
  const [sb, bb] = L[lv()];
  const me = P[0];
  const al = P.filter((p) => !p.out).length;
  const tc = Math.min(cur - me.bet, me.stack);
  const H = $('hint').checked;

  $('info').innerHTML = `<b>Level ${lv() + 1}</b> · Blinds ${f(sb)}/${f(bb)} · Hand ${hands} · ${al} of 6 left · Top 2 paid<br><span class="mu">Blinds rise in ${10 - (hands - 1) % 10} hand(s)</span>`;

  $('tb').innerHTML = P.map((p, i) => {
    const sh = p.h || p.show;
    const cs = p.out || (p.fold && !p.h) ? '' : sh ? p.hole.map(cd).join('') : '<span class="cd bk"></span><span class="cd bk"></span>';

    return `<div class="seat${i ? '' : ' me'}${i == turn ? ' turn' : ''}${p.fold ? ' fold' : ''}${p.out ? ' out' : ''}" style="left:${POS[i][0]}%;top:${POS[i][1]}%"><div>${cs}</div><b>${p.n}</b>${i == btn && !p.out ? ' <i class="d">D</i>' : ''}${H && p.t ? `<small class="t">${p.t}</small>` : ''}<div>${p.out ? 'Out' : f(p.stack)}</div><small>${p.bet ? 'Bet ' + f(p.bet) + ' ' : ''}${p.act}</small></div>`;
  }).join('') + `<div class="mid"><div>Pot ${f(pot)}</div><div>${board.map(cd).join('')}</div><div id="msg">${$('msg') ? $('msg').textContent : ''}</div></div>`;

  $('bc').textContent = tc ? `Call ${f(tc)}` : 'Check';

  const mb = me.stack / bb;
  const z = mb >= 20 ? 'Green zone: play your normal game.' : mb >= 10 ? 'Yellow zone: call less, steal and re-steal more.' : mb >= 5 ? 'Red zone: shove or fold before the blinds eat you.' : 'Critical: shove any playable hand.';

  let h = `<h3>Coach</h3><p><b>${mb.toFixed(1)} big blinds.</b> ${z}</p>`;

  if (ST && H) {
    const a = ST.a;
    const mine = board.length ? `You have: <b>${NM[Math.floor(ev(me.hole.concat(board)) / K)]}</b>` : `Hand score: <b>${a.eq}</b> (Chen formula; about 8+ is a raise from early seats)`;

    const rec = a.a == 'fold' ? (tc ? 'Fold' : 'Check') : a.a == 'call' ? (tc ? `Call ${f(tc)}` : 'Check') : a.to >= me.bet + me.stack ? 'All-in' : `${cur ? 'Raise' : 'Bet'} to ${f(a.to)}`;

    h += `<p>${mine}</p>${a.pre ? '' : `<p>Equity about <b>${pc(a.eq)}</b> against ${a.opp} random hand(s). Pot odds: <b>${pc(a.odds)}</b></p>`}<p>Suggested play: <b style="color:var(--ac)">${rec}</b></p><p class="mu">${a.w}</p>`;
  } else if (!H) {
    h += '<p class="mu">Hints are off. Test yourself, then review the flagged mistakes.</p>';
  } else {
    h += '<p class="mu">Waiting for your turn.</p>';
  }

  const s = stat;
  h += `<p class="mu">Coach agreement ${s.dec ? Math.round((100 * s.agree) / s.dec) : 0}% · mistakes flagged ${s.miss}<br>VPIP ${s.h ? Math.round((100 * s.vpip) / s.h) : 0}% · PFR ${s.h ? Math.round((100 * s.pfr) / s.h) : 0}%</p>`;

  $('coach').innerHTML = h;
}

function end() {
  const w = !P[0].out;
  const pl = w ? 1 : P[0].place;
  const s = stat;

  $('end').innerHTML = `<div class="pn"><h3>${w ? 'You won the tournament' : `Knocked out in ${pl}${sfx(pl)} place`}</h3><p>${pl <= 2 ? 'You finished in the money.' : 'Out of the money. The bubble is where tournaments are decided: watch the short stacks and fold more.'}</p><p class="mu">Hands ${s.h} · coach agreement ${s.dec ? Math.round((100 * s.agree) / s.dec) : 0}% · mistakes flagged ${s.miss} · VPIP ${s.h ? Math.round((100 * s.vpip) / s.h) : 0}% · PFR ${s.h ? Math.round((100 * s.pfr) / s.h) : 0}%</p><button class="pri" onclick="newGame()">Play again</button></div>`;

  $('end').style.display = 'flex';
}

async function play() {
  await hand();

  if (P[0].out || P.filter((p) => !p.out).length == 1) {
    end();
    return;
  }

  $('nx').style.display = 'inline-block';
  await new Promise((r) => (nxr = r));

  return play();
}

function newGame() {
  $('end').style.display = 'none';
  $('log').innerHTML = '';

  P = [{ n: 'You', h: 1 }, ...STY.map((s) => ({ n: s.n, t: s.t, S: s }))].map((p) => ({ ...p, stack: 3000, out: 0, hole: [], bet: 0, tot: 0, act: '', sc: 0 }));

  hands = 0;
  btn = rnd() * 6 | 0;
  pot = 0;
  cur = 0;
  minR = 50;
  nr = 0;
  board = [];
  ST = null;
  stat = { h: 0, dec: 0, agree: 0, miss: 0, vpip: 0, pfr: 0 };
  turn = -1;

  $('hint').onchange = draw;
  play();
}

newGame();
