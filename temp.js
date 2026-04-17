// Template image paths (same directory as this file)
const TEMPLATES = [
    'download.jpeg',
    'download (1).jpeg',
    'download (2).jpeg',
    'download (3).jpeg',
    'download (4).jpeg',
    'download (5).jpeg',
    'download (6).jpeg',
    'download (7).jpeg',
    'download (8).jpeg',
    'download (9).jpeg',
    'download (10).jpeg',
    'download (11).jpeg',
    'download (12).jpeg',
    'download (13).jpeg',
    'download (14).jpeg',
    'download (15).jpeg',
    'download (16).jpeg',
    'download (17).jpeg',
    'download (18).jpeg',
    'download (19).jpeg',
    'download (22).jpeg',
    'download (21).jpeg',
];

const TEMPLATE_LABELS = [
    'Purple Petals', 'Boho Leaves', 'Soft Bloom', 'Watercolor', 'Pink Meadow',
    'Abstract Rose', 'Grey Hearts', 'Dark Marble', 'Black Flowers', 'Book Girl', 'Book Girl 2'
];

let state = {
    templateImg: null,
    userImg: null,
    templateIdx: -1,
    photoScale: 80,
    photoX: 50,
    photoY: 60,
    photoOpacity: 100,
    text: '',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 28,
    bold: false,
    italic: false,
    textColor: '#ffffff',
    textX: 300,
    textY: 90,
    textAlign: 'center',
};

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
let currentPhotoRect = null;
let currentTextRect = null;
let dragState = null;

// Build template thumbnails
const grid = document.getElementById('templateGrid');
TEMPLATES.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'tmpl-thumb';
    div.title = TEMPLATE_LABELS[i];
    div.innerHTML = `<img src="${src}" alt="${TEMPLATE_LABELS[i]}"><span class="tmpl-num">${i + 1}</span>`;
    div.addEventListener('click', () => selectTemplate(i, src));
    grid.appendChild(div);
});

function selectTemplate(idx, src) {
    document.querySelectorAll('.tmpl-thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
    state.templateIdx = idx;
    const img = new Image();
    img.onload = () => { state.templateImg = img; draw(); };
    img.src = src;
}

// File upload
document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => { state.userImg = img; draw(); };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// Text
document.getElementById('textInput').addEventListener('input', e => {
    state.text = e.target.value;
    draw();
});
document.getElementById('fontFamily').addEventListener('change', e => {
    state.fontFamily = e.target.value;
    draw();
});

function toggleStyle(which) {
    if (which === 'bold') {
        state.bold = !state.bold;
        document.getElementById('boldBtn').classList.toggle('active', state.bold);
    } else {
        state.italic = !state.italic;
        document.getElementById('italicBtn').classList.toggle('active', state.italic);
    }
    draw();
}

let fontSize = state.fontSize;
function changeFontSize(delta) {
    fontSize = Math.max(10, Math.min(120, fontSize + delta));
    state.fontSize = fontSize;
    document.getElementById('fsSizeDisplay').textContent = fontSize + 'px';
    draw();
}

// Colors
document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        state.textColor = dot.dataset.color;
        draw();
    });
});

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
}

function isInside(point, rect) {
    return rect &&
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height;
}

canvas.addEventListener('pointerdown', event => {
    const point = getCanvasPoint(event);

    if (isInside(point, currentPhotoRect)) {
        dragState = {
            type: 'photo',
            offsetX: point.x - currentPhotoRect.x,
            offsetY: point.y - currentPhotoRect.y,
        };
    } else if (isInside(point, currentTextRect)) {
        dragState = {
            type: 'text',
            offsetX: point.x - state.textX,
            offsetY: point.y - state.textY,
        };
    } else if (state.text.trim()) {
        state.textX = clamp(point.x, 20, canvas.width - 20);
        state.textY = clamp(point.y, state.fontSize, canvas.height - 20);
        draw();
    }

    if (dragState) {
        canvasWrapper.classList.add('dragging');
        canvas.setPointerCapture(event.pointerId);
    }
});

canvas.addEventListener('pointermove', event => {
    if (!dragState) return;

    const point = getCanvasPoint(event);

    if (dragState.type === 'photo' && currentPhotoRect) {
        const left = point.x - dragState.offsetX;
        const top = point.y - dragState.offsetY;
        const centerX = left + currentPhotoRect.width / 2;
        const centerY = top + currentPhotoRect.height / 2;

        state.photoX = clamp((centerX / canvas.width) * 100, 0, 100);
        state.photoY = clamp((centerY / canvas.height) * 100, 0, 100);
    }

    if (dragState.type === 'text') {
        state.textX = clamp(point.x - dragState.offsetX, 20, canvas.width - 20);
        state.textY = clamp(point.y - dragState.offsetY, state.fontSize, canvas.height - 20);
    }

    draw();
});

function stopDragging(event) {
    if (event && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
    dragState = null;
    canvasWrapper.classList.remove('dragging');
}

canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);

canvas.addEventListener('wheel', event => {
    if (!state.userImg) return;

    const point = getCanvasPoint(event);
    if (!isInside(point, currentPhotoRect)) return;

    event.preventDefault();
    if (event.shiftKey) {
        state.photoOpacity = clamp(state.photoOpacity + (event.deltaY < 0 ? 5 : -5), 10, 100);
    } else {
        state.photoScale = clamp(state.photoScale + (event.deltaY < 0 ? 4 : -4), 10, 200);
    }
    draw();
}, { passive: false });

function draw() {
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Draw template background
    if (state.templateImg) {
        ctx.drawImage(state.templateImg, 0, 0, cw, ch);
    } else {
        ctx.fillStyle = '#1a1714';
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = 'rgba(201,169,110,0.12)';
        ctx.font = '18px DM Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Select a template to begin', cw / 2, ch / 2);
    }

    // Draw user photo
    currentPhotoRect = null;
    if (state.userImg) {
        const maxW = cw * (state.photoScale / 100);
        const ratio = state.userImg.naturalHeight / state.userImg.naturalWidth;
        const imgW = maxW;
        const imgH = maxW * ratio;
        const x = (cw * state.photoX / 100) - imgW / 2;
        const y = (ch * state.photoY / 100) - imgH / 2;

        currentPhotoRect = { x, y, width: imgW, height: imgH };

        ctx.save();
        ctx.globalAlpha = state.photoOpacity / 100;
        ctx.drawImage(state.userImg, x, y, imgW, imgH);
        ctx.restore();
    }

    // Draw text
    currentTextRect = null;
    if (state.text.trim()) {
        const lines = state.text.split('\n');
        const tx = state.textX;
        const ty = state.textY;
        const lh = state.fontSize * 1.4;

        const fontStr = `${state.italic ? 'italic ' : ''}${state.bold ? 'bold ' : ''}${state.fontSize}px ${state.fontFamily}`;
        ctx.font = fontStr;
        ctx.textAlign = state.textAlign;
        ctx.textBaseline = 'alphabetic';

        const widths = lines.map(line => ctx.measureText(line).width);
        const maxWidth = widths.length ? Math.max(...widths) : 0;
        const startY = ty - (lh * (lines.length - 1)) / 2;

        let leftX = tx - maxWidth / 2;
        if (state.textAlign === 'left') leftX = tx;
        if (state.textAlign === 'right') leftX = tx - maxWidth;

        currentTextRect = {
            x: leftX - 12,
            y: startY - state.fontSize,
            width: maxWidth + 24,
            height: (lines.length - 1) * lh + state.fontSize + 16,
        };

        // Subtle text shadow for readability
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = state.textColor;

        lines.forEach((line, i) => {
            ctx.fillText(line, tx, startY + i * lh);
        });
        ctx.restore();
    }
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = 'my-template.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Initial blank draw
draw();