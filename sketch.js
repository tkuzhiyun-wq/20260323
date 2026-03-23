// 全域變數設定
let grasses = [];      // 儲存所有水草物件的陣列
let bubbles = [];      // 儲存氣泡的陣列
let siteFrame;         // 儲存 iframe 元素的變數
let segments = 40;     // 增加節點數讓長水草更平滑
let swayScale = 0.05;  // 雜訊縮放
let palette = ["#606c38", "#283618", "#fefae0", "#faedcd", "#ccd5ae"]; // 指定的顏色色票

function setup() {
  // 採用全螢幕畫布
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);       // 確保畫布對齊左上角
  cnv.style('z-index', '1'); // 畫布在 iframe 之上
  cnv.style('pointer-events', 'none'); // 關鍵：讓滑鼠點擊穿透畫布，使後方網頁可被操作
  strokeCap(ROUND); // 讓線條端點圓滑
  blendMode(BLEND); // 設定混合模式，支援透明度疊加

  // 產生全螢幕 iframe 顯示網頁
  siteFrame = createElement('iframe');
  siteFrame.attribute('src', 'https://www.et.tku.edu.tw');
  siteFrame.position(0, 0);
  siteFrame.size(windowWidth, windowHeight);
  siteFrame.style('border', 'none');
  siteFrame.style('z-index', '-1'); // iframe 在畫布後方

  // 產生 50 根水草，隨機分佈在視窗寬度內
  for (let i = 0; i < 50; i++) {
    let h = random(200, height * 1 / 2); // 高度隨機，且不超過視窗高度的 2/3
    grasses.push(new Grass(random(width), h, random(palette)));
  }
}

function draw() {
  // 使用 clear() 清除畫布背景，讓畫布變透明，達成「水草 > 網頁 > 背景」的層次效果
  clear();
  
  // 設定水草樣式
  noFill();

  // 繪製每一根水草
  for (let grass of grasses) {
    grass.show();
  }

  // 產生並繪製氣泡
  if (random(1) < 0.03) { // 3% 的機率產生新氣泡
    bubbles.push(new Bubble());
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].show();
    if (bubbles[i].finished()) {
      bubbles.splice(i, 1); // 移除已經破掉消失的氣泡
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 當視窗大小改變時，同時調整 iframe 大小
  if (siteFrame) {
    siteFrame.size(windowWidth, windowHeight);
  }
  // 當視窗大小改變時，重新產生水草以適應新寬度
  grasses = [];
  for (let i = 0; i < 50; i++) {
    let h = random(200, height * 2 / 3); // 高度隨機，且不超過視窗高度的 2/3
    grasses.push(new Grass(random(width), h, random(palette)));
  }
}

function mousePressed() {
  // 當按下滑鼠左鍵時，檢查是否點擊到泡泡
  if (mouseButton === LEFT) {
    for (let b of bubbles) {
      // 如果滑鼠位置與泡泡距離小於半徑 (加一點緩衝範圍讓它好點擊)
      if (dist(mouseX, mouseY, b.x, b.y) < b.r + 10) {
        b.popping = true;
      }
    }
  }
}

// 定義水草類別
class Grass {
  constructor(x, h, c) {
    this.x = x;          // X 位置
    this.h = h;          // 高度
    this.c = c;          // 顏色
    this.offset = random(1000); // 隨機的雜訊偏移，讓每根草搖晃不同步
    this.w = random(20, 50);    // 線條寬度在 30 到 60 之間
    this.speed = random(0.002, 0.008); // 降低速度，讓擺動更順暢且緩慢
  }

  show() {
    let col = color(this.c); // 將 HEX 顏色轉為 p5 顏色物件以設定透明度
    col.setAlpha(150);       // 設定透明度 (0-255)，讓水草重疊時有層次感
    stroke(col);
    strokeWeight(this.w); // 套用個別的寬度
    beginShape();
    for (let i = 0; i <= segments; i++) {
      let t = i / segments;
      let y = height - (t * this.h); // 從底部往上長
      // 加入 this.offset 讓雜訊取樣位置錯開
      let noiseVal = noise(frameCount * this.speed + this.offset, i * swayScale);
      let xOffset = map(noiseVal, 0, 1, -50, 50); // 縮小搖晃幅度
      let x = this.x + (xOffset * t);
      vertex(x, y);
    }
    endShape();
  }
}

// 定義氣泡類別
class Bubble {
  constructor() {
    this.x = random(width);
    this.y = height + 10;   // 從視窗底部下方生成
    this.r = random(5, 12); // 氣泡半徑
    this.speed = random(1, 3); // 上升速度
    this.popY = 0;          // 修改：設定破裂高度為 0 (視窗頂部)
    this.popping = false;   // 是否正在破掉
    this.popTimer = 0;      // 破掉動畫的計時器
  }

  update() {
    if (!this.popping) {
      this.y -= this.speed; // 向上移動
      this.x += random(-1, 1); // 輕微左右擺動
      // 如果到達指定高度，開始破掉
      if (this.y < this.popY) {
        this.popping = true;
      }
    } else {
      this.popTimer += 1; // 增加破掉動畫計時
    }
  }

  show() {
    noFill();
    if (!this.popping) {
      stroke(255, 150);
      strokeWeight(2);
      circle(this.x, this.y, this.r * 2);
    } else {
      // 破掉的效果：變大並變透明
      let alpha = map(this.popTimer, 0, 10, 255, 0);
      let size = map(this.popTimer, 0, 10, this.r * 2, this.r * 4);
      stroke(255, alpha);
      strokeWeight(2);
      circle(this.x, this.y, size);
    }
  }

  finished() {
    // 如果正在破掉且動畫播完 (超過 10幀)，則視為結束
    return this.popping && this.popTimer > 10;
  }
}