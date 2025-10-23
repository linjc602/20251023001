// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0;
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 煙火相關的全域變數
let fireworks = []; // 儲存所有活躍煙火物件的陣列


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;

    if (data && data.type === 'H5P_SCORE_RESULT') {

        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;

        console.log("新的分數已接收:", scoreText);

        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw();
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() {
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2);
    colorMode(HSB, 360, 100, 100); // 使用 HSB 色彩模式方便調整顏色
    // 移除 noLoop(); 讓 draw 能夠持續運行來渲染動畫
}

// -----------------------------------------------------------------
// 步驟三：新增煙火效果的類別 (Particle 和 Firework)
// -----------------------------------------------------------------

// 粒子類別 (Particle) - 構成煙火爆炸後的碎片
class Particle {
    constructor(x, y, hue) {
        this.pos = createVector(x, y);
        // 給予一個隨機方向和速度，模擬爆炸
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(2, 10));
        this.acc = createVector(0, 0);
        this.lifespan = 255;
        this.hu = hue;
        this.size = random(2, 4);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        // 模擬重力
        let gravity = createVector(0, 0.2);
        this.applyForce(gravity);
       
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度

        // 逐漸減少生命週期
        this.lifespan -= 4;
    }

    // 判斷粒子是否「死亡」
    isFinished() {
        return this.lifespan < 0;
    }

    show() {
        strokeWeight(this.size);
        // 顏色使用 HSB, saturation 100, brightness 100, alpha (lifespan)
        stroke(this.hu, 100, 100, this.lifespan);
        point(this.pos.x, this.pos.y);
    }
}

// 煙火類別 (Firework) - 負責發射和爆炸
class Firework {
    constructor() {
        // 從畫布底部發射，X軸隨機
        this.hu = random(360); // 隨機顏色
        this.firework = new Particle(random(width), height, this.hu);
        this.exploded = false;
        this.particles = [];
        this.explosionHeight = random(height / 4, height / 2); // 隨機爆炸高度
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, -0.9)); // 向上推力
            this.firework.update();
            // 檢查是否達到爆炸高度（向上移動的火花，y座標會變小）
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸後的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 創建大量粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu);
            this.particles.push(p);
        }
    }

    isFinished() {
        // 火箭已爆炸且所有粒子都消失
        return this.exploded && this.particles.length === 0;
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let p of this.particles) {
            p.show();
        }
    }
}

// score_display.js 中的 draw() 函數片段
function draw() {
    // 使用帶有透明度的背景，製造拖尾效果
    background(0, 0, 0, 0.2); // HSB模式下：黑色且透明度為 0.2

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80);
    textAlign(CENTER);

    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(100, 100, 100); // 白色 (HSB)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);

        // *** 觸發煙火特效 ***
        // 隨機發射新的煙火 (例如每 10 幀發射一個，讓效果不會過於密集)
        if (frameCount % 10 === 0) {
            fireworks.push(new Firework());
        }

    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(45, 100, 100); // 黃色 (HSB)
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);

    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(0, 100, 100); // 紅色 (HSB)
        text("需要加強努力！", width / 2, height / 2 - 50);

    } else {
        // 尚未收到分數或分數為 0
        fill(0, 0, 60); // 灰色 (HSB)
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 80); // 淺灰 (HSB)
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);


    // -----------------------------------------------------------------
    // C. 運行和繪製煙火 (如果分數夠高)
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        // 移除已經結束的煙火
        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }


    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二 - 保持原邏輯但移除 90% 以上的圖形以免與煙火衝突)
    // -----------------------------------------------------------------
    // 移除原有的 90% 以上的圓圈繪製，改由煙火取代。
   
    if (percentage >= 60 && percentage < 90) {
        // 畫一個方形 [4]
        fill(45, 100, 80, 0.5); // 帶透明度 (HSB)
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }

    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight)
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 [8, 9]。
}
