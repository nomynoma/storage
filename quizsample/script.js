// ========================================
// クイズアプリ - メインスクリプト
// ========================================

// ========================================
// 設定：画像ベースURL（カスタマイズ可能）
// ========================================
// デフォルト: GitHub Pagesの絶対URL（GASでも動作）
const IMAGE_BASE_URL = 'https://nomynoma.github.io/storage/quizsample/imgs/';
// フォーク時やローカル開発時は下記に変更
// const IMAGE_BASE_URL = './imgs/';

// ========================================
// 設定：合格証ページベースURL（カスタマイズ可能）
// ========================================
// デフォルト: GitHub Pagesの絶対URL（GASでも動作）
const CERTIFICATE_BASE_URL = 'https://nomynoma.github.io/storage/quizsample/certificate/';
// フォーク時やローカル開発時は下記に変更
// const CERTIFICATE_BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '') + '/certificate/';

let nickname = '';
let levels = ['初級','中級','上級'];
let currentGenre = '';
let currentLevelIndex = 0;
let questions = [];
let currentQuestion = 0;
let score = 0;
let answered = false;
let selectedChoices = [];

// 画面切替
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

// ニックネーム送信
function submitNickname(){
  const input = document.getElementById('nicknameInput').value.trim();
  const errorDiv = document.getElementById('nicknameError');

  // エラーメッセージをクリア
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  // バリデーション
  if(input === ''){
    errorDiv.textContent = 'ニックネームを入力してください';
    errorDiv.style.display = 'block';
    return;
  }
  if(input.length > 10){
    errorDiv.textContent = 'ニックネームは10文字以内で入力してください';
    errorDiv.style.display = 'block';
    return;
  }

  nickname = input;

  // フォームを非表示にして「問題作成中」メッセージを表示
  document.getElementById('nicknameForm').style.display = 'none';
  document.getElementById('preparingMessage').style.display = 'block';

  // 少し待ってからジャンル選択画面へ
  setTimeout(() => {
    document.getElementById('nicknameForm').style.display = 'block';
    document.getElementById('preparingMessage').style.display = 'none';
    showScreen('genreScreen');
  }, 300);
}

// ジャンル選択
function selectGenre(genre){
  currentGenre = genre;
  currentLevelIndex = 0;
  loadLevel(currentGenre, levels[currentLevelIndex]);
}

// --- レベル別問題読み込み ---
function loadLevel(genre, level){
  // Loading画面を表示
  showScreen('loading');

  requestAnimationFrame(() => {
    setTimeout(() => {
      google.script.run
        .withSuccessHandler(function(data){
          questions = data;
          currentQuestion = 0;
          score = 0;
          showQuestion();
        })
        .withFailureHandler(function(err){
          alert('問題の読み込みに失敗しました: '+err);
          showScreen('genreScreen');
        })
        .getQuestions(genre, level);
    }, 50);
  });
}


// 問題表示
function showQuestion(){
  if(currentQuestion >= questions.length){
    showSectionResult();
    return;
  }

  answered = false;
  selectedChoices = [];
  const q = questions[currentQuestion];
  const isMultiple = q.selectionType === 'multiple';
  const isInput = q.selectionType === 'input';
  const isImage = q.displayType === 'image';

  document.getElementById('questionNumber').textContent = '問題 ' + (currentQuestion+1) + ' / ' + questions.length;
  document.getElementById('questionText').innerHTML = q.question;
  document.getElementById('feedback').innerHTML = '';
  document.getElementById('multipleInstruction').style.display = isMultiple ? 'block' : 'none';

  const choicesDiv = document.getElementById('choices');

  // 入力問題の場合
  if(isInput){
    let html = '<input type="text" id="inputAnswer" placeholder="答えを入力してください" class="answer-input">';
    html += '<button id="submitBtn" class="btn submit-btn" onclick="submitInputAnswer()">解答する</button>';
    choicesDiv.innerHTML = html;
  } else {
    // 選択問題の場合（既存のコード）
    const choiceMap = { A: q.choiceA, B: q.choiceB, C: q.choiceC, D: q.choiceD };
    let html = '<div class="image-grid">';
    Object.keys(choiceMap).forEach(label => {
      const onclick = isMultiple ? "toggleChoice('" + label + "')" : "checkAnswer('" + label + "')";
      const buttonClass = 'btn choice-btn' + (isImage ? ' image-choice' : '');
      const content = isImage
        ? '<img src="' + choiceMap[label] + '" alt="選択肢' + label + '" onerror="this.src=\'https://via.placeholder.com/400x250?text=画像読込エラー\'"><div class="image-choice-label">' + label + '</div>'
        : label + ': ' + choiceMap[label];
      html += '<button class="' + buttonClass + '" onclick="' + onclick + '">' + content + '</button>';
    });
    html += '</div>';
    if(isMultiple) html += '<button id="submitBtn" class="btn submit-btn" onclick="submitMultipleAnswer()">解答する</button>';
    choicesDiv.innerHTML = html;
  }

  showScreen('questionScreen');
}

// 複数選択
function toggleChoice(choice){
  if(answered) return;
  const idx = selectedChoices.indexOf(choice);
  if(idx>-1) selectedChoices.splice(idx,1); else selectedChoices.push(choice);
  updateChoiceButtons();
}

function updateChoiceButtons(){
  const buttons = document.querySelectorAll('.choice-btn:not(.submit-btn)');
  const labels = ['A','B','C','D'];
  buttons.forEach((btn,i)=>{
    btn.classList.toggle('selected', selectedChoices.includes(labels[i]));
  });
}

function submitMultipleAnswer(){
  if(answered) return;
  if(selectedChoices.length===0){ alert('少なくとも1つ選択してください'); return;}
  answered = true;
  const q = questions[currentQuestion];
  const correct = q.answer.split(',').map(a=>a.trim());
  const isCorrect = selectedChoices.length === correct.length && selectedChoices.every(c=>correct.includes(c));
  const feedbackDiv = document.getElementById('feedback');
  feedbackDiv.innerHTML = isCorrect ?
    '<div class="result correct">✓ 正解！</div><button class="btn" onclick="nextQuestion()">次へ</button>' :
    '<div class="result incorrect">✗ 不正解！正解は ' + correct.join(', ') + ' です</div><button class="btn" onclick="nextQuestion()">次へ</button>';
  const submitBtn = document.getElementById('submitBtn'); if(submitBtn) submitBtn.style.display='none';
  if(isCorrect) score++;
}

// 単一選択
function checkAnswer(label){
  if(answered) return;
  answered = true;
  const q = questions[currentQuestion];
  const feedbackDiv = document.getElementById('feedback');
  if(q.answer.split(',').includes(label)){ score++; feedbackDiv.innerHTML='<div class="result correct">✓ 正解！</div><button class="btn" onclick="nextQuestion()">次へ</button>';}
  else{ feedbackDiv.innerHTML='<div class="result incorrect">✗ 不正解！正解は ' + q.answer + ' です</div><button class="btn" onclick="nextQuestion()">次へ</button>';}
}

// 入力問題
function submitInputAnswer(){
  if(answered) return;
  const input = document.getElementById('inputAnswer').value.trim();
  if(input === ''){ alert('答えを入力してください'); return;}
  answered = true;
  const q = questions[currentQuestion];
  const feedbackDiv = document.getElementById('feedback');
  const isCorrect = input === q.answer;
  feedbackDiv.innerHTML = isCorrect ?
    '<div class="result correct">✓ 正解！</div><button class="btn" onclick="nextQuestion()">次へ</button>' :
    '<div class="result incorrect">✗ 不正解！正解は ' + q.answer + ' です</div><button class="btn" onclick="nextQuestion()">次へ</button>';
  const submitBtn = document.getElementById('submitBtn'); if(submitBtn) submitBtn.style.display='none';
  if(isCorrect) score++;
}

function nextQuestion(){ currentQuestion++; showQuestion(); }

// レベル結果
function showSectionResult(){
  const levelName = levels[currentLevelIndex];

  if(score === questions.length){
    // 合格：合格証明書を表示
    showCertificate();
  } else {
    // 不合格：不合格画面を表示
    document.getElementById('failResultText').textContent =
      currentGenre + ' - ' + levelName + 'の結果は ' + score + ' / ' + questions.length + ' 問でした';
    showScreen('failScreen');
  }
}

// 合格証明書を表示
function showCertificate(){
  const levelName = levels[currentLevelIndex];
  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日';

  // ジャンル番号を取得（ジャンル1 → 1）
  const genreNumber = currentGenre.replace('ジャンル', '');
  const levelNumber = currentLevelIndex + 1; // 0:初級→1, 1:中級→2, 2:上級→3

  // 背景画像URLを設定（IMAGE_BASE_URLを使用）
  const imageUrl = IMAGE_BASE_URL + 'frame_hyousyoujyou_' + genreNumber + '-' + levelNumber + '.jpg';

  // テキスト内容を準備（CSSクラスで位置・スタイルを指定）
  const levelText = currentLevelIndex === 2 ? '上級全問正解' : levelName + '合格';
  const certificateTextHtml =
    '<div class="certificate-nickname">' + nickname + '殿</div>' +
    '<div class="certificate-date">' + dateStr + '</div>' +
    '<div class="certificate-id">' + genreNumber + '-' + levelNumber + '</div>';

  // ローディング画面を表示して画像生成開始
  showCertificateLoading(levelName, dateStr, imageUrl, certificateTextHtml);
}

// 合格証作成中ローディング表示 → 画像生成 → 合格証画面表示
function showCertificateLoading(levelName, dateStr, imageUrl, certificateTextHtml){
  // ローディング画面を表示（問題画面エリアを使用）
  document.getElementById('questionNumber').innerHTML = '';
  document.getElementById('multipleInstruction').style.display = 'none';
  document.getElementById('questionText').innerHTML =
    '<div class="loading-container">' +
    '<div class="loading-title">🎉 おめでとうございます！</div>' +
    '<div class="loading-message">合格証を作成中...</div>' +
    '<div class="loading-spinner"></div>' +
    '</div>';
  document.getElementById('choices').innerHTML = '';
  document.getElementById('feedback').innerHTML = '';
  showScreen('questionScreen'); // 問題画面エリアを使ってローディング表示

  // キャプチャ用エリアに設定
  document.getElementById('captureImage').src = imageUrl;
  document.getElementById('captureText').innerHTML = certificateTextHtml;

  // 背景画像の読み込みを待つ
  const captureImg = document.getElementById('captureImage');
  captureImg.onload = function() {
    // 画像読み込み完了後、少し待ってからhtml2canvasで生成
    setTimeout(() => {
      generateAndSaveCertificate(levelName, dateStr, imageUrl, certificateTextHtml);
    }, 100);
  };

  // 既に読み込み済みの場合（キャッシュ）
  if (captureImg.complete) {
    setTimeout(() => {
      generateAndSaveCertificate(levelName, dateStr, imageUrl, certificateTextHtml);
    }, 100);
  }
}

// 合格証画像を生成してスプレッドシートに保存後、合格証画面を表示
function generateAndSaveCertificate(levelName, dateStr, imageUrl, certificateTextHtml){
  const captureArea = document.getElementById('captureArea');

  html2canvas(captureArea, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    scale: 2,
    width: 800,
    height: 565
  }).then(canvas => {
    // canvasをBase64形式に変換（JPEG形式で圧縮して軽量化）
    const imageDataBase64 = canvas.toDataURL('image/jpeg', 0.8);

    // スプレッドシートに保存（サーバー側でハッシュ生成）
    google.script.run
      .withSuccessHandler(function(result){
        console.log('合格証画像を保存しました。UUID: ' + result.uuid);
        // 保存完了後に合格証画面を表示（生成した画像を渡す）
        showCertificateScreen(levelName, imageDataBase64, certificateTextHtml, result.uuid);
      })
      .withFailureHandler(function(error){
        console.error('画像保存エラー:', error);
        // エラーでも画像は表示
        showCertificateScreen(levelName, imageDataBase64, certificateTextHtml, null);
      })
      .saveCertificateData({
        genre: currentGenre,
        level: levelName,
        nickname: nickname,
        date: dateStr,
        imageData: imageDataBase64
      });
  }).catch(error => {
    console.error('html2canvasエラー:', error);
    // エラー時は背景画像URLのみで表示（fallback）
    const fallbackImg = new Image();
    fallbackImg.crossOrigin = 'anonymous';
    fallbackImg.src = imageUrl;
    fallbackImg.onload = function() {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 800;
      fallbackCanvas.height = 565;
      const ctx = fallbackCanvas.getContext('2d');
      ctx.drawImage(fallbackImg, 0, 0, 800, 565);
      showCertificateScreen(levelName, fallbackCanvas.toDataURL('image/jpeg', 0.8), certificateTextHtml, null);
    };
  });
}

// 合格証画面を表示（生成した画像を使用）
function showCertificateScreen(levelName, imageDataBase64, certificateTextHtml, uuid){
  // 生成した画像を表示
  document.getElementById('certificateDisplayImage').src = imageDataBase64;

  // ボタンの表示制御
  if(currentLevelIndex < levels.length - 1){
    // 初級・中級：次のレベルへ進むボタンを表示
    document.getElementById('certificateNextBtn').style.display = 'block';
    document.getElementById('certificateRestartBtn').style.display = 'none';
  } else {
    // 上級：最初からときなおすボタンのみ表示
    document.getElementById('certificateNextBtn').style.display = 'none';
    document.getElementById('certificateRestartBtn').style.display = 'block';
  }

  // 合格証画面を表示
  showScreen('certificateScreen');

  // UUIDがある場合はURLを表示
  if(uuid){
    displayCertificateUrl(uuid);
  } else {
    // エラー時は準備中のまま
    document.getElementById('certificateUrlArea').style.display = 'block';
    document.getElementById('certificateUrlLabel').textContent = '⚠️ 合格証URLの生成に失敗しました';
    document.getElementById('certificateUrl').style.display = 'none';
    document.getElementById('certificateUrlCopyBtn').style.display = 'none';
  }
}

// Xで共有（合格時）
function shareToX(){
  const levelName = levels[currentLevelIndex];
  const levelText = currentLevelIndex === 2 ? '上級全問正解' : levelName + '合格';
  const text = 'クイズアプリで' + currentGenre + 'の' + levelText + 'しました！君も挑戦してみよう！';
  const url = window.location.origin + window.location.pathname;
  const twitterUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// Xで共有（失敗時）
function shareFailToX(){
  const levelName = levels[currentLevelIndex];
  const text = 'クイズアプリで' + currentGenre + 'の' + levelName + 'に挑戦したよ！' + score + '/' + questions.length + '問正解！君も挑戦してみよう！';
  const url = window.location.origin + window.location.pathname;
  const twitterUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}


// 合格証URLを表示
function displayCertificateUrl(hash){
  // 合格証ページのURLを生成（CERTIFICATE_BASE_URLを使用）
  const certificateUrl = CERTIFICATE_BASE_URL + '?g=' + hash;

  // ラベルを更新
  document.getElementById('certificateUrlLabel').textContent = '🔗 合格証URL（別窓で開けます）';

  // URLとボタンを表示
  document.getElementById('certificateUrl').href = certificateUrl;
  document.getElementById('certificateUrl').textContent = certificateUrl;
  document.getElementById('certificateUrl').style.display = 'block';
  document.getElementById('certificateUrlCopyBtn').style.display = 'inline-block';
  document.getElementById('certificateUrlArea').style.display = 'block';

  // グローバル変数に保存（コピー用）
  window.currentCertificateUrl = certificateUrl;
}

// 合格証URLをコピー
function copyCertificateUrl(){
  if(window.currentCertificateUrl){
    navigator.clipboard.writeText(window.currentCertificateUrl).then(() => {
      alert('URLをコピーしました！');
    }).catch(err => {
      console.error('コピー失敗:', err);
      // フォールバック：テキストエリアを使う方法
      const textarea = document.createElement('textarea');
      textarea.value = window.currentCertificateUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('URLをコピーしました！');
    });
  }
}

// レベルをやり直す
function retryLevel(){
  loadLevel(currentGenre, levels[currentLevelIndex]);
}

function nextSection(){
  // ボタン連打防止
  document.getElementById('certificateNextBtn').disabled = true;

  // ブラウザが Loading を描画してから処理を開始
  requestAnimationFrame(() => {
    currentLevelIndex++;
    if(currentLevelIndex < levels.length){
      document.getElementById('certificateNextBtn').disabled = false;
      loadLevel(currentGenre, levels[currentLevelIndex]);
    }
  });
}

function restartQuiz(){
  nickname = '';
  currentGenre = '';
  currentLevelIndex = 0;
  questions = [];
  currentQuestion = 0;
  score = 0;
  answered = false;
  selectedChoices = [];
  document.getElementById('nicknameInput').value = '';

  // ニックネーム画面の表示状態をリセット
  document.getElementById('nicknameForm').style.display = 'block';
  document.getElementById('preparingMessage').style.display = 'none';

  showScreen('nicknameScreen');
}
