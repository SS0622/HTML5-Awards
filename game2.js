console.log("window.onload");
sessionStorage.clear();
const canvas = document.getElementById('display');
const video = document.getElementById('startVideo');
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d');
const yArray = [0, 200, 180, 160, 140, 120];
const yButton = [0, 160, 130, 100, 70, 40];
const fileNameList = {
    "./json/synopsis.json": "あらすじ",
    "./json/scenario1.json": "イライジャ登場",
    "./json/scenario2_.json": "聞き込み場所選択",
    "./json/scenario2_leaving_school.json": "下校ルート",
    "./json/scenario2_park.json": "公園",
    "./json/scenario2_residential_area.json": "自宅周辺",
    "./json/scenario2_school.json": "学校",
    "./json/scenario3.json": "調べもの",
    "./json/scenario4_harikomi.json": "張り込み",
    "./json/scenario4_down.json": "事務所帰宅",
    "./json/scenario5_break.json": "牢屋",
    "./json/scenario7_orga.json": "真相",
    "./json/scenario8_director.json": "犯人",
    "./json/scenario9_true.json": "やらなきゃいけないこと",
    "./json/ending2.json": "調べもの",
    "./json/ending3_churuEND.json": "牢屋",
    "./json/ending5.json": "再会",
}
//初期化
const audioCtx = new AudioContext();
const worker = new Worker('./worker.js');
let source;
let bgmPath;
let currentScenarioIndex = 0;
let fetchedData;
let background = new Image();
let character = new Array(3).fill(new Image());
let logo = new Image();
const customCursorImage = "./image/defalut.png";
const customCursorImage2 = "./image/eye3.png";
const customCursorImage3 = "./image/dast.png";
class Queue {
    constructor() {
        this.queue = [];
    }
    enqueue(item) {
        this.queue.push(item);
    }
    dequeue() {
        return this.queue.shift();
    }
    isEmpty() {
        return this.queue.length === 0;
    }
}
const jsonqu = new Queue();
const jsonType = new Queue();
let saveData = {
    filename: "",
    date: new Date(),
    currentIndex: 0,
    background: "",
    bgm: "",
    character: [],
    selected: new Map()
}
let dictionary = new Map();


//スタート画面動画再生
async function startGame() {
    let isClicked = false;
    let isMouseOver = false;
    return new Promise(resolve => {
        console.log("startGame()開始");
        let isRunning = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //playBGM('./music/MusMus-BGM-105.mp3');
        video.addEventListener('canplaythrough', function drawAndPlay() {
            logo.src = "./image/DetectiveCat_logo.png";
            logo.onload = () => {
                console.log("ビデオ再生");
                function draw() {
                    // 動画の描画
                    video.play();
                    if (!isRunning) return;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.drawImage(logo, 120, 60, 500, 200);
                    ctx.beginPath();
                    ctx.ellipse(400, 330, 80, 40, 0, 0, 2 * Math.PI);
                    if (isClicked) {
                        console.log('押されたよ');
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 半透明の黒
                        ctx.beginPath();
                        ctx.ellipse(405, 405, 85, 45, 0, 0, 2 * Math.PI);
                        ctx.fill();
                    } else if (isMouseOver) {
                        ctx.fillStyle = 'red';

                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
                    }
                    ctx.fill();
                    //ctx.fillRect(350, 300, 100, 50); // x, y, width, height
                    //スタートボタンの文字
                    ctx.fillStyle = 'white';
                    ctx.font = '24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('start', 400, 330);
                    //タイトル文字
                    // 線形グラデーション
                    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    gradient.addColorStop(0, 'red');
                    gradient.addColorStop(1, 'blue');

                    // 文字を描画
                    ctx.fillStyle = gradient;
                    ctx.font = '60px sans-serif';
                    //ctx.fillText('DetectiveCat', 400, 100);
                    requestAnimationFrame(draw);
                }
                draw();
                // スタートボタンにクリックイベントを追加
                function handleClick(event) {
                    const rect = canvas.getBoundingClientRect();
                    console.log("クリック46");
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;
                    if (isInside(x, y, 350, 450, 300, 350)) {
                        isClicked = true;
                        draw();
                        setTimeout(() => {
                            isClicked = false;
                        }, 1000);
                        console.log('スタートボタンがクリックされました');
                        canvas.removeEventListener('click', handleClick);
                        canvas.removeEventListener('mousemove', hover);
                        isRunning = false;

                        resolve('startGame()終了');
                    }
                }
                function hover(event) {
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = event.clientX - rect.left;
                    const mouseY = event.clientY - rect.top;
                    if (isInside(mouseX, mouseY, 350, 450, 300, 350)) isMouseOver = true;
                    else isMouseOver = false;
                }
                canvas.addEventListener('click', handleClick);
                canvas.addEventListener('mousemove', hover)
            }
        });
    });
}
//シナリオstart
async function scenario(data, type) {
    console.log("scenario()開始+", data + "だよ");
    const response = await fetch(data);
    fetchedData = await response.json();
    console.log(await scenarioExecute(type));
    return "scenario()終了", data + "だよ";
}
//シナリオノベルゲームエンジンstart
function scenarioExecute(type) {
    console.log("-----scenarioExecute()開始------");
    return new Promise(resolve => {
        if (type == 'scenario') {
            console.log('scenario');
            displayScenario(() => {
                resolve("-----scenarioExecute()完全終了------");
            });
        } else if (type == 'synopsis') {
            console.log('synopsis');
            displaySynopsisAndEnding(() => {
                resolve("-----synopsisExecute()完全終了------");
            });
        } else if (type == 'search') {
            console.log('search');
            displaySearch(() => {
                resolve("-----searchExecute()完全終了-----");
            })
        } else if (type == 'ED') {
            console.log('ED');
            displayED(() => {
                resolve("-----EDExecute()完全終了-----");
            })
        }
    });
}
// OP
function displaySynopsisAndEnding(callback) {
    console.log("displaySynopsisAndEnding()開始" + currentScenarioIndex);
    //現在表示中のシナリオのオブジェクトを取得
    const currentScenario = fetchedData[currentScenarioIndex];
    let alpha = 0;
    let isRunning = true;
    if (currentScenario.BGM !== "") {
        playBGM(currentScenario.BGM, 'play');
    }
    if (currentScenario.backDisplay != "") {
        console.log("画像を描画" + currentScenario.backDisplay);
        background.src = currentScenario.backDisplay;
        background.onload = () => {
            draw();
        }
    } else {
        draw();
    }
    function draw() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        let y = yArray[currentScenario.text.length];
        const x = canvas.width / 2;
        // 文字を徐々に浮かび上がらせる
        alpha += 0.003;
        if (alpha >= 1) alpha = 1;
        ctx.font = '20px Arial';
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        for (const t of currentScenario.text) {
            ctx.fillText(t, x, y);
            y += 30;
        }
        requestAnimationFrame(draw);
    }
    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (0 <= x && x <= canvas.width && 0 <= y && y <= canvas.height) {
            isRunning = false;
            console.log("クリックSynopsisAndEnding");
            currentScenarioIndex++;
            canvas.removeEventListener('click', handleClick);
            if (currentScenario.next.length != 0) {
                discrimination(currentScenario.next, 0, callback, 'scenario');
            } else if (fetchedData.length <= currentScenarioIndex) {
                callback();
                return;
            } else {
                console.log("displaySynopsisAndEnding()終了" + (currentScenarioIndex - 1));
                displaySynopsisAndEnding(callback);
            }
        }

    }
    setTimeout(function () { canvas.addEventListener('click', handleClick); }, 5000);
    canvas.addEventListener('click', handleClick);
}
// ED
function displayED(callback) {
    const currentScenario = fetchedData[currentScenarioIndex];
    let alpha = 0;
    let isRunning = true;
    const text = currentScenario.text;
    const initialY = 150; // 初期の y 座標
    const lineHeight = 50; // 行の高さ
    if (currentScenario.BGM !== "") playBGM(currentScenario.BGM, 'play');
    if (currentScenario.background != "") {
        background.src = currentScenario.background;
        background.onload = () => { draw() };
    } else draw();
    function draw() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        const x = canvas.width / 2; //キャンバスの中央
        let y = initialY; //文字の縦方向
        // 文字を徐々に浮かび上がらせる
        alpha += 0.003;
        if (alpha >= 1) alpha = 1;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        // ctx.font = 'bold 40px "Roboto", sans-serif';
        for (let i = 0; i < text.length; i++) {
            if (i == 0) {
                ctx.font = 'bold 40px "Verdana", sans-serif';
                ctx.fillText(text[i], x, y);
            } else {
                ctx.font = '20px "Verdana"';
                ctx.fillText(text[i], x, y);
            }
            y += lineHeight; // 次の行に進む
            console.log(ctx.font);
        }
        requestAnimationFrame(draw);
    }
    setTimeout(function () {
        currentScenarioIndex++;
        isRunning = false;
        if (fetchedData.length <= currentScenarioIndex) {
            callback();
            return;
        } else {
            console.log("displayED()終了" + (currentScenarioIndex - 1));
            displayED(callback);
        }
    }, 8000);
}
// シナリオ
function displayScenario(callback) {
    console.log("displayScenario()開始" + currentScenarioIndex);
    //現在表示中のシナリオのオブジェクトを取得
    const currentScenario = fetchedData[currentScenarioIndex];
    let isRunning = true;
    let skipTyping = false;
    let nextStep = false;
    let saveIsMouseOver = false;
    let loIsMouseOver = false;
    let flagNum = 0;
    const x = 130;
    const choices = currentScenario.choices;
    const next = currentScenario.next;
    const flagLength = choices.length;
    let isMouseOver = new Array(flagLength).fill(false);
    //選択肢のクリック範囲の設定の初期化
    let choicesRange = { "y": [0, 0, 0, 0, 0] };
    const xwidth = (canvas.width - 400) / 2
    let text;
    let charIndex = 0;
    let lineIndex = 0;
    let y = 280;
    // 選択肢が存在する場合
    if (flagLength > 0) {
        const flagNames = currentScenario.flagName;
        // anchorにjsonファイル名が入っている場合
        if (currentScenario.anchor !== "false") dictionary.set(currentScenario.anchor, currentScenarioIndex);
        for (let i = 0; i < flagNames.length; i++) {
            //dictionaryに存在する場合
            if (!dictionary.has(flagNames[i])) dictionary.set(flagNames[i], currentScenario.choicesFlag[i][0]);
            // 現在の選択肢に来るのが２回目以上の場合
            if (dictionary.get(flagNames[i]) == 'selected') flagNum++;
            else if (dictionary.get(flagNames[i]) == 'false') {
                // 条件を満たしていたら選択し表示
                for (let j = 1; j < currentScenario.choicesFlag.length; j++) {
                    if (dictionary.get(currentScenario.choicesFlag[i][j]) != 'selected') {
                        console.log("selectedではなかったためfalse", i);
                        break;
                    }
                    if (j == currentScenario.choicesFlag.length - 1) dictionary.set(flagNames[i], 'true');
                }
            }
        }
        const choicesCount = currentScenario.choicesCount;
        console.log("選択肢の通った数", flagNum, "上限", choicesCount);
        // 選択肢を上限まで選択している場合
        if (flagNum == choicesCount) {
            console.log("選択肢を全て通ったため次へ移動");
            isRunning = false;
            canvas.removeEventListener('click', handleClick);
            discrimination(currentScenario.choicesCountNext, 0, callback, 'scenario');
            return;
        }
    }
    // 選択肢が存在する場合で、現在の選択肢に来るのが２回目以上の場合
    if (flagNum > 0) {
        console.log("text2");
        text = currentScenario.text2;
    } else {
        console.log("text");
        text = currentScenario.text;
    }
    console.log(currentScenario.text);
    //音楽が変更されていた場合
    if (currentScenario.BGM !== "") playBGM(currentScenario.BGM, 'play');
    //背景やキャラクターが変更されていた場合
    if (currentScenario.backDisplay !== "" && currentScenario.character.length !== 0) {
        console.log("両方読み込み");
        let loadedImages = 0;
        const totalImages = 2; // 読み込む画像の数
        background.src = currentScenario.backDisplay;
        character.src = currentScenario.character[0];
        background.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                console.log("両方の画像の読み込みが完了しました", character.src, background.src);
                draw();
            }
        };
        character.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                console.log("両方の画像の読み込みが完了しました", character.src, background.src);
                draw();
            }
        };
    } else if (currentScenario.backDisplay !== "") {
        console.log("背景読み込み");
        background.src = currentScenario.backDisplay;
        background.onload = () => {
            console.log("背景の読み込みが完了しました", character.src, background.src);
            draw();
        };
    } else if (currentScenario.character.length !== 0) {
        console.log("キャラクター読み込み");
        character.src = currentScenario.character[0];
        character.onload = () => {
            console.log("背景の読み込みが完了しました", character.src, background.src);
            draw();
        };
    } else {
        console.log("何も検知しませんでした", character.src, background.src);
        draw();
    }
    function draw() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(character, 400, 20, 80, 300);
        //seve
        console.log(saveIsMouseOver);
        if (saveIsMouseOver) roundRect(ctx, 650, 30, 130, 40, 10, 'rgba(253, 161, 161, 0.8)', 'rgba(251, 194, 194, 0.5)');
        else roundRect(ctx, 650, 30, 130, 40, 10, 'rgba(161, 196, 253, 0.8)', 'rgba(194, 233, 251, 0.5)');
        if (loIsMouseOver) roundRect(ctx, 650, 90, 130, 40, 10, 'rgb(253, 205, 161)', 'rgba(251, 197, 194, 0.66)');
        else roundRect(ctx, 650, 90, 130, 40, 10, 'rgb(91, 207, 87)', 'rgba(70, 224, 109, 0.8)');
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText("セーブ", 715, 55);
        ctx.fillText("ロード", 715, 110);
        //テキストボックス
        roundRect(ctx, 10, 240, 780, 150, 20, 'rgba(161, 196, 253, 0.8)', 'rgba(194, 233, 251, 0.5)'); // x, y, 幅, 高さ, 角の丸みの半径, 色
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(currentScenario.person, 50, 280);
        //文字が全て表示される前にクリックされた場合の描画
        if (skipTyping) {
            y = 280;
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            for (const t of text) {
                ctx.fillText(t, x, y);
                y += 25;
            }
            nextStep = true;
        } else if (!nextStep) {
            if (0 < lineIndex) {
                let ynum = 280;
                ctx.font = 'bold 15px sans-serif';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'left';
                for (let i = 0; i < lineIndex; i++) {
                    ctx.fillText(text[i], x, ynum);
                    ynum += 25;
                }
            }
            console.log(text[lineIndex]);
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.fillText(text[lineIndex].slice(0, charIndex + 1), x, y);
            charIndex++;
            if (charIndex >= text[lineIndex].length - 1) {
                charIndex = 0;
                lineIndex++;
                y += 25;
            }
            if (!(lineIndex < text.length)) {
                nextStep = true;
                skipTyping = true;
            }
        }
        //文字が全て表示されていて選択肢が存在する場合
        if (nextStep && flagLength !== 0) {
            let ynum = yButton[flagLength - flagNum];
            let num = 0;
            for (let i = 0; i < flagLength; i++) {
                // falseの場合表示しない
                if (dictionary.get(currentScenario.flagName[i]) === 'true') {
                    if (isMouseOver[i]) roundRect(ctx, xwidth, ynum - 25, 400, 30, 10, 'rgba(253, 196, 161, 0.8)', 'rgba(255, 0, 0, 0.5)');
                    else roundRect(ctx, xwidth, ynum - 25, 400, 30, 10, 'rgba(161, 196, 253, 0.8)', 'rgba(194, 233, 251, 0.5)');
                    choicesRange.y[num] = ynum - 25;
                    ctx.font = 'bold 25px sans-serif';
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center';
                    ctx.fillText(choices[i], canvas.width / 2, ynum);
                    ynum += 40;
                    num++;
                }
            }
        }
        requestAnimationFrame(draw);
    }
    async function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        //セーブクリック
        if (isInside(clickX, clickY, 650, 780, 30, 70)) {
            isRunning = false;
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', hover);
            await saveDisplay('save');
            isRunning = true;
            canvas.addEventListener('click', handleClick);
            canvas.addEventListener('mousemove', hover);
            draw();
            return;
        }
        //ロードクリック
        if (isInside(clickX, clickY, 650, 780, 90, 130)) {
            isRunning = false;
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', hover);
            await saveDisplay('load');
            if(sessionStorage.getItem('load') == 1) callback();
            sessionStorage.setItem('load', 0);
            isRunning = true;
            canvas.addEventListener('click', handleClick);
            canvas.addEventListener('mousemove', hover);
            draw();
            return;
        }
        //選択肢が存在する場合のクリック動作
        if (nextStep && flagLength !== 0) {
            console.log("条件分岐発生", x, y);
            let num = 0;
            for (let i = 0; i < flagLength; i++) {
                //console.log(choicesRange.y[i]);
                if (dictionary.get(currentScenario.flagName[i]) === 'true') {
                    if (isInside(clickX, clickY, xwidth, xwidth + 400, choicesRange.y[num], choicesRange.y[num] + 30)) {
                        console.log("選択肢をクリック");
                        isRunning = false;
                        canvas.removeEventListener('click', handleClick);
                        canvas.removeEventListener('mousemove', hover);
                        dictionary.set(currentScenario.flagName[i], 'selected');
                        console.log(dictionary.get(currentScenario.flagName[i]));
                        discrimination(next, i, callback, 'scenario');
                        return;
                    }
                    num++;
                }
            }
        } else {
            console.log("ノーマルクリック");
            if (isInside(clickX, clickY, 0, canvas.width, 0, canvas.height)) {
                console.log("クリックdisplayScenario");
                if (!nextStep && !skipTyping) {
                    skipTyping = true;
                } else {
                    isRunning = false;
                    currentScenarioIndex++;
                    canvas.removeEventListener('click', handleClick);
                    canvas.removeEventListener('mousemove', hover);
                    // 特定の条件でのみ進む場合
                    const Flagged = currentScenario.Flagged;
                    console.log(Flagged);
                    if (currentScenario.endFlag != "") {
                        console.log("ゲーム終了");
                        if (currentScenario.endFlag == 'end5') ED("./json/endrole.json");
                        else callback();
                    } else if (Flagged.length != 0) {
                        console.log("Flaggetf発動", Flagged);
                        for (let i = 2; i < Flagged.length; i++) {
                            if (dictionary.get(Flagged[i]) !== 'selected') {
                                console.log("flagが立っていない", Flagged[i], dictionary.get(Flagged[i]));
                                break;
                            }
                            if (i == Flagged.length - 1) {
                                console.log("flag成立");
                                const nextArray = [Flagged[0], Flagged[1]];
                                discrimination(nextArray, 0, callback, 'scenario');
                                return;
                            }
                        }
                        //シナリオの先がない場合は終了。また、nextに値が存在する場合の処理
                    }
                    if (next.length != 0) {
                        console.log("他の所に移動");
                        discrimination(next, 0, callback, 'scenario');
                    } else if (fetchedData.length <= currentScenarioIndex) {
                        console.log("######################################current到達");
                        callback();
                    } else {
                        console.log("displayScenario()終了" + (currentScenarioIndex - 1));
                        displayScenario(callback);
                    }
                    return;
                }
            }
        }

    }
    function hover(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        // 選択肢hover
        if (nextStep && flagLength !== 0) {
            let num = 0;
            for (let i = 0; i < flagLength; i++) {
                if (dictionary.get(currentScenario.flagName[i]) === 'true') {
                    if (isInside(mouseX, mouseY, xwidth, xwidth + 400, choicesRange.y[num], choicesRange.y[num] + 30)) isMouseOver[i] = true;
                    else isMouseOver[i] = false;
                    num++;
                }
            }
        }
        // セーブボタンhover
        if (isInside(mouseX, mouseY, 650, 780, 30, 70)) saveIsMouseOver = true;
        else saveIsMouseOver = false;
        if (isInside(mouseX, mouseY, 650, 780, 90, 130)) loIsMouseOver = true;
        else loIsMouseOver = false;
    }
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', hover);
}
//探索パート
function displaySearch(callback) {
    console.log("displaySearch()開始----", currentScenarioIndex);
    let currentScenario = fetchedData[currentScenarioIndex];
    let isRunning = true;
    let newFlag = false;
    let skipTyping = false;
    let nextStep = false;
    let charIndex = 0;
    let lineIndex = 0;
    let y = 280;
    const x = 130;
    let collision = [];

    //探索パート関数に初めて来た場合
    if (currentScenarioIndex == 0) {
        console.log("探索パート関数に初めて来た場合");
        currentScenarioIndex = 1;
        currentScenario = fetchedData[currentScenarioIndex];
        newFlag = true;
        for (let i = 0; i < currentScenario.quantity; i++) {
            dictionary.set(currentScenario.name[i], currentScenario.displayFlag[i][0]);
            //console.log(dictionary.get(currentScenario.name[i]), currentScenario.displayFlag[i][0]);
        }
    }
    //特定の条件で出てくる
    if (currentScenarioIndex == 1) {
        const quantity = currentScenario.quantity;
        collision = [];
        for (let i = 0; i < quantity; i++) {
            let str = dictionary.get(currentScenario.name[i]);
            if (str == 'false') {
                console.log("//特定の条件で出てくる");
                for (let j = 2; j < quantity; j++) {
                    if (dictionary.get(currentScenario.displayFlag[i][j]) != 'selected') break;
                    if (j == quantity - 1) {
                        console.log("選択増加");
                        dictionary.set(currentScenario.name[i], 'true');
                        currentScenarioIndex = currentScenario.next[i];
                        console.log(currentScenarioIndex);
                        displaySearch(callback);
                    }
                }
            } else if (str == 'true') {
                console.log(currentScenario.name[i]);
                collision.push(
                    {
                        xl: currentScenario.coordinateX[i],
                        xr: currentScenario.width[i],
                        yu: currentScenario.coordinateY[i],
                        yd: currentScenario.height[i]
                    }
                );
            }
        }
        console.log(collision.length);
        canvas.addEventListener('mousemove', hover);
    }
    if (newFlag) {
        background.src = fetchedData[0].background;
        background.onload = () => {
            draw();
        }
    } else draw();
    canvas.addEventListener('click', handleClick);
    function draw() {
        if (!isRunning) return;
        console.log(canvas.style.cursor);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        if (currentScenarioIndex != 1) {
            roundRect(ctx, 10, 240, 780, 150, 20, 'rgba(161, 196, 253, 0.8)', 'rgba(194, 233, 251, 0.5)');
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            //文字が全て表示される前にクリックされた場合の描画
            if (skipTyping) {
                y = 280;
                for (const t of currentScenario.text) {
                    ctx.fillText(t, x, y);
                    y += 25;
                }
                nextStep = true;
            } else {
                if (0 < lineIndex) {
                    let ynum = 280;
                    for (let i = 0; i < lineIndex; i++) {
                        ctx.fillText(currentScenario.text[i], x, ynum);
                        ynum += 25;
                    }
                }
                ctx.fillText(currentScenario.text[lineIndex].slice(0, charIndex + 1), x, y);
                charIndex++;
                if (charIndex > currentScenario.text[lineIndex].length) {
                    charIndex = 0;
                    lineIndex++;
                    y += 25;
                }
                if (lineIndex < currentScenario.text.length) {
                    ;
                } else {
                    nextStep = true;
                    skipTyping = true;
                }
            }
            requestAnimationFrame(draw);
        }

    }
    //クリック関する
    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (currentScenarioIndex == 1) {
            console.log("クリック", x, y);
            for (let i = 0; i < currentScenario.quantity; i++) {
                if (dictionary.get(currentScenario.name[i]) == 'true') {
                    if (isInside(x, y, currentScenario.coordinateX[i], currentScenario.width[i], currentScenario.coordinateY[i], currentScenario.height[i])) {
                        console.log("物がクリックされました", currentScenario.name);
                        canvas.style.cursor = `url(${customCursorImage}), pointer`;
                        isRunning = false;
                        canvas.removeEventListener('click', handleClick);
                        canvas.removeEventListener('mousemove', hover);
                        dictionary.set(currentScenario.name[i], 'selected');
                        currentScenarioIndex = currentScenario.next[i];
                        displaySearch(callback);
                    }
                }
            }
        } else {
            if (isInside(x, y, 0, canvas.width, 0, canvas.height)) {
                if (!nextStep && !skipTyping) {
                    skipTyping = true;
                } else {
                    isRunning = false;
                    currentScenarioIndex++;
                    canvas.removeEventListener('click', handleClick);
                    //
                    if (currentScenario.next.length === 1) {
                        discrimination(currentScenario.next, 0, callback, 'search');
                    } else if (fetchedData.length <= currentScenarioIndex) {
                        callback();
                    } else {
                        console.log("displayScenario()終了" + (currentScenarioIndex - 1));
                        displaySearch(callback);
                    }
                    return;
                }
            }
        }
    }
    //マウスhover関数(1番つらかったかもしれない)
    function hover(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        //これ必須
        let i = 0;
        const siz = collision.length - 1;
        //console.log(canvas.style.cursor);
        //canvas.style.cursor = `url(${customCursorImage}), pointer`;
        collision.forEach(col => {
            //console.log(col.xl+"<="+mouseX+"<="+col.xr,col.yu+"<="+mouseY+"<="+col.yd);
            //console.log(isInside(mouseX,mouseY,col.xl,col.xr,col.yu,col.yd));
            if (isInside(mouseX, mouseY, col.xl, col.xr, col.yu, col.yd)) {
                canvas.style.cursor = `url(${customCursorImage2}), pointer`;
                console.log("-----------------------------------遠田", canvas.style.cursor);
                return 0;
            }
            if (i == siz) canvas.style.cursor = `url(${customCursorImage}), pointer`;
            i++;
        });
    }
}
// 音楽再生
function playBGM(bgmSource, command) {
    if (command == 'play' && bgmPath == bgmSource) return;
    bgmPath = bgmSource;
    let audioBuffer;
    console.log("playBGM()開始");
    fetch(bgmSource)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(buffer => {
            audioBuffer = buffer;
            console.log("音楽読み込み完了", command, audioBuffer);
            worker.postMessage({ command });
        })
        .catch(error => {
            console.error('Error loading audio:', error);
            throw error;
        });
    worker.onmessage = (event) => {
        console.log("音楽WebWorkerから送信");
        const { command } = event.data;
        if (command === 'playAudio') {
            console.log("playAudio");
            if (source) {
                console.log('stopAudio');
                source.stop();
            }
            source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            // GainNode の作成
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.1; // ボリュームを半分にする (0.0～1.0)

            // 音源と GainNode を接続
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            source.start();
        }
    };
}
//　セーブスロット画面
async function saveDisplay(either) {
    console.log("saveDisplay開始");
    const slotNum = 3;
    let isRunning = true;
    let isMouseOver = [false, false, false];
    let reIsMouseOver = false;
    const width = 400;
    const x = (canvas.width / 2) - (width / 2);
    const y = 120;
    const height = 50;
    const radius = 30;
    let scrollOffset = 0;
    const scrolllimit = 20 - 3;
    let deleteFlag = false;
    let isMouseOverCanvas = true;
    let confirmation = -1;
    const confirmationX = 100;
    const coX1 = canvas.width / 2 - confirmationX - 30;
    const coX2 = canvas.width / 2 + 30;
    let coIsMouseOver = [false, false];
    const mozi = ["はい", "いいえ"];
    const moziX = [(coX1 + confirmationX / 2), coX2 + confirmationX / 2];
    let slot = [1, 2, 3];
    // スロットスクロール
    function handleScroll(event) {
        console.log("スクロール");
        if (isMouseOverCanvas) {
            event.preventDefault();
            console.log("canvas状");
            if (event.deltaY > 0 && scrollOffset + 1 <= scrolllimit) scrollOffset++;
            else if ((!(event.deltaY > 0)) && scrollOffset - 1 >= 0) scrollOffset--;
        }
    }
    function mouseEnter() {
        isMouseOverCanvas = true;
    }
    // マウスがCanvasから外れた時の処理
    function mouseLeave() {
        isMouseOverCanvas = false;
    }
    function draw() {
        if (!isRunning) return;
        let yd = y;
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (either == 'start') ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = 'blue';
        ctx.textAlign = 'center';
        if (either == 'start') ctx.fillText("セーブスロットを選択して下さい", canvas.width / 2, 80);
        else ctx.fillText("セーブする場所を選択して下さい", canvas.width / 2, 80);
        ctx.font = 'bold 15px sans-serif';
        for (let i = 0; i < slotNum; i++) {
            const n = (i + 1 + scrollOffset);
            // スロット
            if (isMouseOver[i]) roundRect(ctx, x, yd, width, height, radius, 'rgba(253, 161, 218, 0.8)', 'rgba(251, 194, 194, 0.43)');
            else roundRect(ctx, x, yd, width, height, radius, 'rgba(236, 255, 96, 0.8)', 'rgba(255, 255, 0, 0.5)');
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'blue';
            // データが入っているかでテキストを変更
            if (localStorage.getItem(n) != null) {
                const rinzi = JSON.parse(localStorage.getItem(n));
                ctx.fillText("セーブポイント：" + fileNameList[rinzi.filename], canvas.width / 2, yd + 13);
                ctx.fillText(rinzi.date, canvas.width / 2, yd + 32);
            } else ctx.fillText("新規セーブスロット" + n, canvas.width / 2, yd + 25);
            slot[i] = n;
            yd += 80;
        }
        drawArrow(ctx, 170, 220, 150, 5, 'rgb(255, 255, 255)');
        // 削除ボタン
        if (deleteFlag) {
            roundRect(ctx, 650, 30, 130, 40, 10, 'rgb(253, 205, 161)', 'rgba(251, 197, 194, 0.66)');
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillText("削除選択中", 715, 50);
        } else {
            roundRect(ctx, 650, 30, 130, 40, 10, 'rgb(91, 207, 87)', 'rgba(70, 224, 109, 0.8)');
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillText("セーブ削除", 715, 50);
        }
        //戻るボタン
        if (either != 'start') {
            if (reIsMouseOver) roundRect(ctx, 650, 90, 130, 40, 10, 'rgb(253, 205, 161)', 'rgba(251, 197, 194, 0.66)');
            else roundRect(ctx, 650, 90, 130, 40, 10, 'rgb(91, 207, 87)', 'rgba(70, 224, 109, 0.8)');
            ctx.font = 'bold 15px sans-serif';
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fillText("戻る", 715, 110);
        }
        // 削除最終確認
        if (confirmation != -1) {
            roundRect(ctx, 150, 100, 500, 250, 10, 'rgba(162, 162, 162, 0.83)', 'rgba(73, 69, 69, 0.89)');
            ctx.fillStyle = 'rgba(223, 43, 43, 0.88)';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("本当に削除しますか", canvas.width / 2, 170);
            roundRect(ctx, coX1, 230, confirmationX, 50, 10, 'rgba(0, 0, 0, 0.69)', 'rgba(0, 0, 0,0.5)');
            roundRect(ctx, coX2, 230, confirmationX, 50, 10, 'rgba(0, 0, 0, 0.69)', 'rgba(0, 0, 0, 0.5)');
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.style = 'white';
            for (let i = 0; i < 2; i++) {
                if (coIsMouseOver[i]) {
                    if (i == 0) ctx.fillStyle = 'red';
                    else ctx.fillStyle = 'blue';
                } else {
                    ctx.fillStyle = 'white';
                }
                ctx.fillText(mozi[i], moziX[i], 230 + 25);
            }
        }
        requestAnimationFrame(draw);
    }
    //　hover
    function hover(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        let yh = y;
        if (confirmation == -1) {
            for (let i = 0; i < slotNum; i++) {
                if (isInside(mouseX, mouseY, x, x + width, yh, yh + height)) isMouseOver[i] = true;
                else isMouseOver[i] = false;
                yh += 80;
            }
        } else {
            if (isInside(mouseX, mouseY, coX1, coX1 + confirmationX, 230, 280)) coIsMouseOver[0] = true;
            else coIsMouseOver[0] = false;
            if (isInside(mouseX, mouseY, coX2, coX2 + confirmationX, 230, 280)) coIsMouseOver[1] = true;
            else coIsMouseOver[1] = false;
        }
        //戻るボタンhover
        if (either != 'start') {
            if (isInside(mouseX, mouseY, 650, 780, 90, 130)) reIsMouseOver = true;
            else reIsMouseOver = false;
        }
    }
    return new Promise(resolve => {
        function handleClick(event) {
            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            console.log(clickX, clickY);
            let yc = y;
            if (either != 'start') {
                if (isInside(clickX, clickY, 650, 780, 90, 130)) {
                    isRunning = false;
                    canvas.removeEventListener('click', handleClick);
                    canvas.removeEventListener('mousemove', hover);
                    canvas.removeEventListener('mouseenter', mouseEnter);
                    canvas.removeEventListener('mouseleave', mouseLeave);
                    canvas.removeEventListener('wheel', handleScroll);
                    isMouseOverCanvas = false;
                    scrollOffset = 0;
                    resolve("戻って終了");
                    return;
                }
            }
            if (confirmation == -1) {
                // 削除をクリックまたはセーブスロットをクリック
                if (isInside(clickX, clickY, 650, 780, 30, 70)) {
                    if (deleteFlag) {
                        deleteFlag = false;
                        canvas.style.cursor = `url(${customCursorImage}),pointer`;
                    } else {
                        deleteFlag = true;
                        canvas.style.cursor = `url(${customCursorImage3}),pointer`;
                    }
                } else {
                    for (let i = 0; i < slotNum; i++) {
                        const slotnum = i + 1 + scrollOffset;
                        if (isInside(clickX, clickY, x, x + width, yc, yc + height)) {
                            if (deleteFlag) {
                                confirmation = slotnum;
                            } else {
                                isRunning = false;
                                canvas.removeEventListener('click', handleClick);
                                canvas.removeEventListener('mousemove', hover);
                                canvas.removeEventListener('mouseenter', mouseEnter);
                                canvas.removeEventListener('mouseleave', mouseLeave);
                                canvas.removeEventListener('wheel', handleScroll);
                                isMouseOverCanvas = false;
                                scrollOffset = 0;
                                sessionStorage.setItem('セーブスロット番号', slotnum);
                                if (either == 'start') {
                                    // 新規データの場合とセーブスロットにデータが入っている場合
                                    if (localStorage.getItem(slotnum) == null) {
                                        console.log("新規スタート");
                                        saveData.filename = './json/synopsis.json';
                                        saveData.date = new Date();
                                        saveData.currentIndex = 0;
                                        dictionary.set(-1, -1);
                                        saveData.selected = Array.from(dictionary);
                                        localStorage.setItem(slotnum, JSON.stringify(saveData));
                                        console.log(localStorage.getItem(slotnum));
                                        jsonqu.enqueue('./json/synopsis.json');
                                        jsonType.enqueue('synopsis');
                                    } else {
                                        // セーブ画面からロード
                                        console.log(JSON.parse(localStorage.getItem(slotnum)));
                                        const savedata = JSON.parse(localStorage.getItem(slotnum));
                                        dictionary = new Map(savedata.selected);
                                        dictionary.set(savedata.filename, savedata.currentIndex);
                                        jsonqu.enqueue(savedata.filename);
                                        sessionStorage.setItem('background',savedata.background);
                                        sessionStorage.setItem('bgm', savedata.bgm);
                                        sessionStorage.setItem('character', savedata.character);
                                        if (savedata.filename.includes('synopsis')) jsonType.enqueue('synopsis');
                                        else jsonType.enqueue('scenario');
                                    }
                                } else if (either == 'load') {
                                    console.log(JSON.parse(localStorage.getItem(slotnum)));
                                    const savedata = JSON.parse(localStorage.getItem(slotnum));
                                    dictionary = new Map(savedata.selected);
                                    dictionary.set(savedata.filename, savedata.currentIndex);
                                    jsonqu.enqueue(savedata.filename);
                                    sessionStorage.setItem('background',savedata.background);
                                    sessionStorage.setItem('bgm', savedata.bgm);
                                    sessionStorage.setItem('character', savedata.character);
                                    sessionStorage.setItem('load',1);
                                    if (savedata.filename.includes('synopsis')) jsonType.enqueue('synopsis');
                                    else jsonType.enqueue('scenario');
                                } else {
                                    console.log("saveする", sessionStorage.getItem('saveする'));
                                    saveData.filename = sessionStorage.getItem('saveする');
                                    saveData.date = new Date();
                                    saveData.currentIndex = currentScenarioIndex;
                                    dictionary.set(-1, -1);
                                    saveData.selected = Array.from(dictionary);
                                    console.log(saveData.selected);
                                    localStorage.setItem(slotnum, JSON.stringify(saveData));
                                }
                                resolve("セーブスロット終了");
                                return;
                            }
                        }
                        yc += 80;
                    }
                }
            } else {
                if (isInside(clickX, clickY, coX1, coX1 + confirmationX, 230, 280)) {
                    localStorage.removeItem(confirmation);
                    confirmation = -1;
                } else if (isInside(clickX, clickY, coX2, coX2 + confirmationX, 230, 280)) {
                    confirmation = -1;
                }
            }
        }
        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', hover);
        canvas.addEventListener('mouseenter', mouseEnter);
        canvas.addEventListener('mouseleave', mouseLeave);
        canvas.addEventListener('wheel', handleScroll);
        draw();
    });
}
// ボックス表示
function roundRect(ctx, x, y, width, height, radius, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, colorStart); // 開始色
    gradient.addColorStop(1, colorEnd);   // 終了色
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fillStyle = gradient;
    ctx.fill();
}
function drawArrow(ctx, x, y, length, width, color) {
    // 矢印の線のスタイル
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    // 矢印の軸を描画
    ctx.beginPath();
    ctx.moveTo(x, y - length / 2); // 上端
    ctx.lineTo(x, y + length / 2); // 下端
    ctx.stroke();

    // 上矢印の頭
    ctx.beginPath();
    ctx.moveTo(x, y - length / 2); // 上端
    ctx.lineTo(x - width * 2, y - length / 2 + width * 3);
    ctx.lineTo(x + width * 2, y - length / 2 + width * 3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // 下矢印の頭
    ctx.beginPath();
    ctx.moveTo(x, y + length / 2); // 下端
    ctx.lineTo(x - width * 2, y + length / 2 - width * 3);
    ctx.lineTo(x + width * 2, y + length / 2 - width * 3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
//行き先を指定する
function discrimination(next, i, callback, func) {
    if (next.every(element => typeof element === 'number')) {
        currentScenarioIndex = next[i];
        console.log("数字");
        if (func == 'scenario') displayScenario(callback);
        else if (func == 'search') displaySearch(callback);
    } else {
        const str = next[i];
        if (next == 3) {
            console.log("特定の場所に移動");
            dictionary.set(str, next[2]);
        }
        jsonqu.enqueue(str);
        jsonType.enqueue(next[1]);
        callback();
    }
    return;
}
//clickやmousemoveが範囲内か判定する
function isInside(x, y, leftX, rightX, upeerY, underY) {
    return leftX <= x && x <= rightX && upeerY <= y && y <= underY;
}
// 画像の読み込みをPromiseでラップ
function loadImage(image, src) {
    return new Promise((resolve, reject) => {
        image.src = src; // 画像のソースを設定
        image.onload = () => resolve(image); // 読み込み成功
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`)); // 読み込み失敗
    });
}
// バックグラウンドとキャラクター両方読み込み
function loadAllImages(num) {
    return Promise.all([
        loadImage(background, 'path/to/background.jpg'),
        for(let i=0;i<num;i++){
            loadImage(character, 'path/to/character.png'),
        }
        
    ]);
}
// キャラクター読み込み
function loadAllImagesCharacter() {
    return Promise.all([
        loadImage(background, 'path/to/background.jpg'),
        loadImage(character, 'path/to/character.png'),
    ]);
}

// ゲームスタート
async function main() {
    try {
        canvas.style.cursor = `url(${customCursorImage}),pointer`
        console.log(await startGame());
        await saveDisplay('start');
        while (!jsonqu.isEmpty()) {
            const d = jsonqu.dequeue();
            const type = jsonType.dequeue();
            sessionStorage.setItem('saveする', d);
            console.log(sessionStorage.getItem('saveする'), "#############################");
            currentScenarioIndex = 0;
            if (dictionary.has(d)) currentScenarioIndex = dictionary.get(d);
            console.log(await scenario(d, type));
            console.log(jsonqu);
        }
        console.log("本当に終わった？");
    } catch (error) {
        console.error('エラーが発生しました:', error);
        setTimeout(() => {
            console.log("10 seconds passed!");
        }, 20000);
    } finally {
        console.log("最初から");
        //window.location.reload();
    }
}
window.onload = function () {
    main();
}


