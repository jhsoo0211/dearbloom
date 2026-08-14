/**
 * 절차적 3D 꽃 씬 — 확정 시안 `design/app-v3/result.html` 의 three.js 코드를 옮긴 것.
 *
 * 시안과 같은 규칙을 지킨다:
 *  - 꽃잎은 `petalInto()` 하나로 만든다. 프로필 곡선(base·tip·round·tipR)과 휨(curl·cup)만
 *    바꿔서 장미·튤립·수상꽃차례를 전부 같은 함수로 뽑는다. 한 꽃의 꽃잎은 BufferGeometry
 *    하나에 누적해 드로우콜을 줄인다.
 *  - 조명·톤매핑·크로스페이드(opacity+scale)·색 lerp 는 시안 값 그대로다.
 *
 * **React 를 모른다.** 이 모듈은 캔버스 하나를 받아 씬을 세우고 조작 손잡이를 돌려준다.
 * three 는 무거우니 화면 쪽에서 `await import()` 로 늦게 불러온다 —
 * 그래서 이 파일이 three 를 import 하는 유일한 지점이어야 한다.
 */

import * as THREE from 'three';

import type { FlowerForm } from './types';

export interface SceneFlower {
  form: FlowerForm;
  /** 꽃잎 색(선택된 색 칩). */
  petalHex: string;
  /** 림라이트 색 — 그 꽃 카테고리의 강조색. */
  rimHex: string;
}

export interface MountOptions {
  canvas: HTMLCanvasElement;
  /** 크기·포인터 이벤트를 받을 무대 엘리먼트. */
  host: HTMLElement;
  flowers: SceneFlower[];
  active: number;
  reduceMotion: boolean;
  onDragChange?: (dragging: boolean) => void;
}

export interface SceneHandle {
  setActive: (index: number) => void;
  setPetalColor: (index: number, hex: string) => void;
  dispose: () => void;
}

/* ------------------------------------------------------------------ *
 * 꽃잎 생성기
 * ------------------------------------------------------------------ */

interface Accum {
  pos: number[];
  uv: number[];
  idx: number[];
}

interface PetalOptions {
  /** 가로·세로 분할 수. */
  su?: number;
  sv?: number;
  /** 폭·길이. */
  w: number;
  len: number;
  /** 프로필 곡선 — 밑동(base)·끝(tip)·전체 두께(round)·끝 둥글기(tipR). */
  base?: number;
  tip?: number;
  round?: number;
  tipR?: number;
  /** 뒤로 젖힘(curl)·오므림(cup)·끝 파임(notch). */
  curl?: number;
  cup?: number;
  notch?: number;
}

const _v = new THREE.Vector3();

function petalInto(A: Accum, o: PetalOptions, M?: THREE.Matrix4): void {
  const su = o.su ?? 11;
  const sv = o.sv ?? 14;
  const w = o.w;
  const len = o.len;
  const base = o.base ?? 0.8;
  const tip = o.tip ?? 0.9;
  const curl = o.curl ?? 0;
  const cup = o.cup ?? 0;
  const notch = o.notch ?? 0;
  const round = o.round ?? 1;
  const tipR = o.tipR ?? 0;
  const start = A.pos.length / 3;

  for (let j = 0; j <= sv; j++) {
    const v = j / sv;
    let prof = Math.min(1, Math.pow(Math.sin(Math.PI * Math.pow(v, base)), tip) * round);
    if (tipR > 0 && v > 1 - tipR) {
      const q = (v - (1 - tipR)) / tipR;
      prof *= Math.sqrt(Math.max(0, 1 - q * q));
    }
    for (let i = 0; i <= su; i++) {
      const u = (i / su) * 2 - 1;
      _v.set(
        u * w * prof,
        len * (v - notch * Math.pow(v, 7) * (1 - u * u)),
        curl * len * v * v + cup * w * prof * u * u,
      );
      if (M) _v.applyMatrix4(M);
      A.pos.push(_v.x, _v.y, _v.z);
      A.uv.push((u + 1) / 2, v);
    }
  }
  for (let j = 0; j < sv; j++) {
    for (let i = 0; i < su; i++) {
      const a = start + j * (su + 1) + i;
      const b = a + 1;
      const c = a + su + 1;
      const d = c + 1;
      A.idx.push(a, c, b, b, c, d);
    }
  }
}

function accum(): Accum {
  return { pos: [], uv: [], idx: [] };
}

function bake(A: Accum): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setIndex(A.idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
  g.computeVertexNormals();
  return g;
}

/** 꽃잎 한 장을 놓을 자리(방위각·기울기·반지름·높이·크기·비틀기)를 행렬로 만든다. */
const _pivot = new THREE.Object3D();
const _arm = new THREE.Object3D();
_pivot.add(_arm);

function at(
  az: number,
  tilt: number,
  rad: number,
  y: number,
  s: number,
  roll = 0,
): THREE.Matrix4 {
  _pivot.rotation.set(0, az, 0);
  _arm.rotation.set(-tilt, 0, roll);
  _arm.position.set(0, y, -rad);
  _arm.scale.setScalar(s);
  _pivot.updateMatrixWorld(true);
  return _arm.matrixWorld;
}

function tube(pts: [number, number, number][], r: number): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.TubeGeometry(curve, 26, r, 8, false);
}

function matPetal(color: THREE.ColorRepresentation, sheen: THREE.ColorRepresentation) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.32,
    clearcoatRoughness: 0.55,
    sheen: 1,
    sheenColor: new THREE.Color(sheen),
    sheenRoughness: 0.72,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.06,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });
}

function matGreen() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x35543f),
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.18,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
  });
}

interface BuiltFlower {
  group: THREE.Group;
  scale: number;
  y: number;
  rim: THREE.Color;
  /** 색 칩이 바꾸는 재질(꽃잎만 — 줄기·잎은 그대로 초록이다). */
  petals: THREE.MeshPhysicalMaterial[];
}

/* ── 1. 장미형 : 황금각 나선 겹꽃 ──────────────────────────────────── */
function buildRose(petalHex: string, rimHex: string): BuiltFlower {
  const g = new THREE.Group();
  const A = accum();
  const B = accum();
  const N = 54;
  const GA = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    petalInto(
      A,
      {
        su: 13,
        sv: 22,
        w: 0.42,
        len: 0.92,
        base: 1.5,
        tip: 0.5,
        round: 1.9,
        tipR: 0.3,
        curl: 0.9 - 1.85 * t,
        cup: 1.26 - 0.62 * t,
      },
      at(
        i * GA,
        0.16 + 1.26 * Math.pow(t, 1.3),
        0.02 + 0.2 * Math.pow(t, 1.35),
        0.12 - 0.2 * t,
        0.5 + 0.8 * Math.pow(t, 0.6),
        Math.sin(i * 2.27) * 0.12,
      ),
    );
  }
  for (let k = 0; k < 5; k++) {
    petalInto(
      B,
      { su: 7, sv: 10, w: 0.15, len: 0.52, base: 0.62, tip: 1.2, curl: -0.55, cup: 0.34 },
      at((k * Math.PI * 2) / 5 + 0.35, 2.25, 0.11, -0.24, 1),
    );
  }
  petalInto(
    B,
    { su: 9, sv: 13, w: 0.3, len: 1.0, base: 1.0, tip: 0.7, round: 1.15, curl: 0.28, cup: 0.36 },
    at(0.55, 1.3, 0.06, -1.16, 1),
  );
  petalInto(
    B,
    { su: 9, sv: 13, w: 0.26, len: 0.84, base: 1.0, tip: 0.7, round: 1.15, curl: 0.28, cup: 0.36 },
    at(3.55, 1.42, 0.06, -1.66, 1),
  );

  const petal = matPetal(petalHex, rimHex);
  g.add(new THREE.Mesh(bake(A), petal));
  // 화탁 — 나선 중심의 틈을 메운다
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), petal));
  const green = matGreen();
  g.add(new THREE.Mesh(bake(B), green));
  g.add(
    new THREE.Mesh(
      tube(
        [
          [0, -0.1, 0],
          [0.05, -0.74, 0.04],
          [-0.04, -1.45, -0.03],
          [0.03, -2.3, 0.02],
        ],
        0.045,
      ),
      green,
    ),
  );

  return { group: g, scale: 0.62, y: -0.02, rim: new THREE.Color(rimHex), petals: [petal] };
}

/* ── 2. 튤립형 : 컵꽃 6장(3+3) ─────────────────────────────────────── */
function buildTulip(petalHex: string, rimHex: string): BuiltFlower {
  const g = new THREE.Group();
  const A = accum();
  const S = accum();
  const B = accum();

  for (let k = 0; k < 3; k++) {
    petalInto(
      A,
      { su: 13, sv: 20, w: 0.5, len: 1.46, base: 1.0, tip: 0.52, round: 1.16, tipR: 0.14, curl: 0.2, cup: 1.02 },
      at((k * Math.PI * 2) / 3, 0.3, 0.085, -0.02, 1),
    );
  }
  for (let k = 0; k < 3; k++) {
    petalInto(
      A,
      { su: 13, sv: 20, w: 0.44, len: 1.32, base: 1.0, tip: 0.55, round: 1.16, tipR: 0.14, curl: 0.3, cup: 1.16 },
      at((k * Math.PI * 2) / 3 + Math.PI / 3, 0.21, 0.058, 0, 1),
    );
  }
  for (let k = 0; k < 6; k++) {
    petalInto(
      S,
      { su: 5, sv: 7, w: 0.055, len: 0.46, base: 0.9, tip: 0.5, curl: 0.1, cup: 0.22 },
      at((k * Math.PI) / 3, 0.17, 0.035, 0.02, 1),
    );
  }
  petalInto(
    B,
    { su: 8, sv: 16, w: 0.27, len: 1.95, base: 0.9, tip: 0.52, curl: 0.52, cup: 0.52 },
    at(0.45, 1.16, 0.05, -1.45, 1),
  );
  petalInto(
    B,
    { su: 8, sv: 16, w: 0.23, len: 1.6, base: 0.9, tip: 0.52, curl: 0.52, cup: 0.52 },
    at(3.55, 1.26, 0.05, -1.9, 1),
  );

  const petal = matPetal(petalHex, rimHex);
  g.add(new THREE.Mesh(bake(A), petal));
  g.add(
    new THREE.Mesh(
      bake(S),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x8a672b),
        roughness: 0.68,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    ),
  );
  const green = matGreen();
  g.add(new THREE.Mesh(bake(B), green));
  g.add(
    new THREE.Mesh(
      tube(
        [
          [0, -0.05, 0],
          [0.02, -0.85, 0.03],
          [-0.03, -1.7, -0.02],
          [0.02, -2.5, 0.01],
        ],
        0.05,
      ),
      green,
    ),
  );

  return { group: g, scale: 0.92, y: -0.62, rim: new THREE.Color(rimHex), petals: [petal] };
}

/* ── 3. 수상형 : 작은 종꽃을 기둥에 인스턴싱 ───────────────────────── */
function buildSpike(petalHex: string, rimHex: string): BuiltFlower {
  const g = new THREE.Group();
  const F = accum();
  const B = accum();

  for (let k = 0; k < 6; k++) {
    // 화통(짧은 관)
    petalInto(
      F,
      { su: 5, sv: 6, w: 0.085, len: 0.24, base: 1.0, tip: 0.35, round: 1.5, curl: 0.02, cup: 1.0 },
      at((k * Math.PI) / 3, 0.1, 0.028, 0, 1),
    );
  }
  for (let k = 0; k < 6; k++) {
    // 뒤로 젖혀진 화피 6장
    petalInto(
      F,
      { su: 7, sv: 10, w: 0.155, len: 0.4, base: 1.05, tip: 0.6, round: 1.35, curl: -0.5, cup: 0.8 },
      at((k * Math.PI) / 3, 0.8, 0.055, 0.2, 1),
    );
  }

  const fg = bake(F);
  const LV = 9;
  const PER = 5;
  const petal = matPetal(petalHex, rimHex);
  const im = new THREE.InstancedMesh(fg, petal, LV * PER);
  const d = new THREE.Object3D();
  d.rotation.order = 'YXZ';
  let n = 0;
  for (let L = 0; L < LV; L++) {
    const t = L / (LV - 1);
    const y = 1.0 - 1.82 * t;
    const r = 0.09 + 0.3 * Math.pow(t, 0.62);
    for (let k = 0; k < PER; k++) {
      const az = L * 1.06 + (k * Math.PI * 2) / PER;
      d.position.set(Math.sin(az) * r, y, Math.cos(az) * r);
      d.rotation.set(Math.PI / 2 + 0.12 + 0.46 * t, az, 0);
      d.scale.setScalar(0.58 + 0.54 * t);
      d.updateMatrix();
      im.setMatrixAt(n++, d.matrix);
    }
  }
  im.instanceMatrix.needsUpdate = true;
  g.add(im);

  for (let k = 0; k < 3; k++) {
    petalInto(
      B,
      { su: 7, sv: 16, w: 0.19, len: 1.55 + k * 0.16, base: 0.95, tip: 0.5, round: 1.1, curl: 0.4, cup: 0.52 },
      at(k * 2.1 + 0.4, 0.84 + k * 0.08, 0.16, -1.78, 1),
    );
  }
  const green = matGreen();
  g.add(new THREE.Mesh(bake(B), green));
  g.add(
    new THREE.Mesh(
      tube(
        [
          [0, 1.1, 0],
          [0.01, 0.2, 0.01],
          [-0.02, -0.9, -0.01],
          [0.02, -2.4, 0.01],
        ],
        0.05,
      ),
      green,
    ),
  );

  return { group: g, scale: 0.78, y: -0.02, rim: new THREE.Color(rimHex), petals: [petal] };
}

function build(flower: SceneFlower): BuiltFlower {
  if (flower.form === 'tulip') return buildTulip(flower.petalHex, flower.rimHex);
  if (flower.form === 'spike') return buildSpike(flower.petalHex, flower.rimHex);
  return buildRose(flower.petalHex, flower.rimHex);
}

/* ------------------------------------------------------------------ *
 * 씬
 * ------------------------------------------------------------------ */

/** WebGL 을 쓸 수 있는지. 못 쓰면 화면이 SVG 폴백을 그대로 둔다. */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

export function mountFlowerScene(options: MountOptions): SceneHandle {
  const { canvas, host, reduceMotion } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0.16, 4.85);
  camera.lookAt(0, -0.02, 0);

  scene.add(new THREE.HemisphereLight(0xf6f1e8, 0x141613, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e4, 2.5);
  key.position.set(2.6, 3.4, 2.8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8a3448, 2.2);
  rim.position.set(-2.8, 1.1, -2.4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xf6f1e8, 6, 12);
  fill.position.set(-0.6, -1.4, 2.6);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const flowers = options.flowers.map(build);
  const mats: THREE.Material[][] = flowers.map((f) => {
    const list: THREE.Material[] = [];
    f.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.material) list.push(mesh.material as THREE.Material);
    });
    f.group.position.y = f.y;
    world.add(f.group);
    return list;
  });

  const fade = flowers.map((_, i) => (i === options.active ? 1 : 0));
  let target = options.active;
  const petalTargets: (THREE.Color | null)[] = flowers.map(() => null);

  /* ── 드래그 회전 ── */
  let rotY = -0.35;
  let rotX = 0.26;
  let tRotX = 0.26;
  let dragging = false;
  let px = 0;
  let py = 0;

  function onPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement | null)?.closest('a,button')) return;
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    options.onDragChange?.(true);
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* 캡처를 못 잡아도 드래그 자체는 동작한다 */
    }
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    rotY += (e.clientX - px) * 0.0085;
    tRotX = Math.max(-0.22, Math.min(0.72, tRotX + (e.clientY - py) * 0.004));
    px = e.clientX;
    py = e.clientY;
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    options.onDragChange?.(false);
  }
  host.addEventListener('pointerdown', onPointerDown);
  host.addEventListener('pointermove', onPointerMove);
  host.addEventListener('pointerup', endDrag);
  host.addEventListener('pointercancel', endDrag);
  host.addEventListener('lostpointercapture', endDrag);

  /* ── 크기 ── */
  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(host);
  else window.addEventListener('resize', resize);

  /* ── 화면 밖이면 쉰다 ── */
  let onScreen = true;
  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          onScreen = entries[0]?.isIntersecting ?? true;
        }, { threshold: 0 })
      : null;
  if (io) io.observe(host);

  /* ── 루프 — 프레임레이트와 무관하게 일정한 전환 ── */
  const tmp = new THREE.Color();
  let raf = 0;
  let last = performance.now();
  let disposed = false;

  function tick(now: number) {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.12, (now - last) / 1000);
    last = now;
    if (!onScreen || document.hidden) return;

    if (!dragging && !reduceMotion) rotY += 0.3 * dt;
    rotX += (tRotX - rotX) * Math.min(1, dt * 9);
    world.rotation.y = rotY;
    world.rotation.x = rotX;

    const k = reduceMotion ? 1 : Math.min(1, dt * 7.5);
    for (let i = 0; i < flowers.length; i++) {
      const goal = i === target ? 1 : 0;
      fade[i] += (goal - fade[i]) * k;
      if (Math.abs(goal - fade[i]) < 0.01) fade[i] = goal;
      const f = flowers[i];
      const visible = fade[i] > 0.01;
      f.group.visible = visible;
      if (!visible) continue;
      f.group.scale.setScalar(f.scale * (0.9 + 0.1 * fade[i]));
      for (const material of mats[i]) {
        material.opacity = fade[i];
        material.depthWrite = fade[i] > 0.96;
      }
    }

    const kc = reduceMotion ? 1 : Math.min(1, dt * 4.5);
    for (let i = 0; i < flowers.length; i++) {
      const wanted = petalTargets[i];
      if (!wanted) continue;
      for (const material of flowers[i].petals) {
        material.color.lerp(wanted, kc);
        material.emissive.lerp(wanted, kc);
        // 광택도 함께 옮긴다 — 색만 바뀌면 하이라이트가 겉돈다
        material.sheenColor.lerp(wanted, kc);
      }
    }

    tmp.copy(flowers[target].rim);
    rim.color.lerp(tmp, reduceMotion ? 1 : Math.min(1, dt * 5));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  return {
    setActive(index) {
      if (index >= 0 && index < flowers.length) target = index;
    },
    setPetalColor(index, hex) {
      if (index < 0 || index >= flowers.length) return;
      petalTargets[index] = new THREE.Color(hex);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerup', endDrag);
      host.removeEventListener('pointercancel', endDrag);
      host.removeEventListener('lostpointercapture', endDrag);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
      io?.disconnect();
      for (const flower of flowers) {
        flower.group.traverse((o) => {
          const mesh = o as THREE.Mesh;
          mesh.geometry?.dispose();
        });
      }
      for (const list of mats) for (const material of list) material.dispose();
      renderer.dispose();
    },
  };
}
