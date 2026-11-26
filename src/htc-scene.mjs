import { dot, lookAt, multiply, perspective, project, sub } from './space3d.mjs';

export const defaultDesign = Object.freeze({ layout: 'galley', cabinetry: 'sage', worktop: 'stone' });

const cabinetFinishes = {
  original: ['#867265', '#a78e78', '#c7aa89'],
  sage: ['#3d5148', '#596e5e', '#819182'],
  navy: ['#2d4056', '#415a76', '#6d8da8'],
  oak: ['#785033', '#a5724b', '#c99862'],
};
const worktops = {
  original: ['#64625c', '#79766c', '#a4a098'],
  stone: ['#8f9692', '#bec2b9', '#dedfd5'],
  timber: ['#815535', '#9f6a45', '#cd9c6c'],
  charcoal: ['#343c43', '#4e565a', '#717a7c'],
};
const layouts = {
  galley: [
    [0.24, 0, 1.5, 0.62, 0.88, 2.15],
    [3.18, 0, 1.5, 0.62, 0.88, 2.15],
  ],
  'l-shape': [
    [0.24, 0, 1.25, 0.62, 0.88, 2.4],
    [0.86, 0, 3.03, 2.35, 0.88, 0.62],
  ],
  island: [
    [0.24, 0, 3.02, 3.56, 0.88, 0.62],
    [1.17, 0, 1.12, 1.8, 0.88, 0.8],
  ],
};

const originalDesign = Object.freeze({ layout: 'galley', cabinetry: 'original', worktop: 'original' });

export function kitchenBlocks(design, before = false) {
  if (before) design = originalDesign;
  const cabinets = Object.hasOwn(cabinetFinishes, design.cabinetry) && cabinetFinishes[design.cabinetry];
  const counters = Object.hasOwn(worktops, design.worktop) && worktops[design.worktop];
  const layout = Object.hasOwn(layouts, design.layout) && layouts[design.layout];
  if (!cabinets || !counters || !layout) throw new RangeError('Unknown kitchen configuration.');
  const blocks = [
    { box: [0, -0.18, 0, 4, 0.18, 3.9], colors: ['#37433f', '#4e6058', '#a6a18e'] },
    { box: [0, 0, 3.72, 4, 2.25, 0.13], colors: ['#a0a697', '#d7ddd0', '#eeeede'] },
    { box: [0, 0, 0, 0.13, 2.25, 3.72], colors: ['#959d91', '#b9c5b9', '#eeeede'] },
  ];
  for (const box of layout) {
    const [x, y, z, width, height, depth] = box;
    blocks.push({ box, colors: cabinets });
    blocks.push({ box: [x - 0.025, y + height, z - 0.025, width + 0.05, 0.06, depth + 0.05], colors: counters });
  }
  return blocks;
}

const faces = [
  { indices: [0, 4, 7, 3], normal: [-1, 0, 0], shade: 0 },
  { indices: [1, 2, 6, 5], normal: [1, 0, 0], shade: 0 },
  { indices: [0, 3, 2, 1], normal: [0, 0, -1], shade: 1 },
  { indices: [4, 5, 6, 7], normal: [0, 0, 1], shade: 1 },
  { indices: [3, 7, 6, 2], normal: [0, 1, 0], shade: 2 },
];

function visibleFaces({ box, colors }, eye, matrix, width, height) {
  const [x, y, z, w, h, d] = box;
  const vertices = [
    [x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z],
    [x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d],
  ];
  return faces
    .filter(({ indices, normal }) => dot(sub(eye, vertices[indices[0]]), normal) > 0)
    .map(({ indices, shade }) => {
      const points = indices.map(index => project(vertices[index], matrix, width, height));
      return {
        points,
        color: colors[shade],
        depth: points.reduce((total, point) => total + point.depth, 0) / points.length,
      };
    });
}

export function drawKitchen(canvas, design, { before, angle }) {
  const context = canvas.getContext('2d');
  if (!context) return false;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return false;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.scale(scale, scale);

  const target = [1.92, 0.96, 1.86];
  const distance = 8.9 / Math.min(1, width / height);
  const eye = [target[0] + Math.cos(angle) * distance, 6, target[2] - Math.sin(angle) * distance];
  const matrix = multiply(perspective(0.63, width / height, 0.1, 80), lookAt(eye, target));
  const polygons = kitchenBlocks(design, before)
    .flatMap(block => visibleFaces(block, eye, matrix, width, height))
    .sort((a, b) => b.depth - a.depth);
  for (const { points, color } of polygons) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = '#17231f50';
    context.stroke();
  }
  return true;
}
