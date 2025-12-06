// ========================================
// 合格証表示ページ - スクリプト
// ========================================

// UUIDを取得（Apps Script テンプレート構文から挿入される）
// var uuid = '<?!= uuid ?>'; はHTMLファイル側で定義

var certificateData = null; // グローバルに保持
var isLoading = false; // リクエスト実行中フラグ
var isLoaded = false; // データ取得完了フラグ

console.log('UUIDパラメータ:', uuid);

// 合格証データを取得して表示（1回のみ実行）
if (uuid && uuid !== '' && !isLoading && !isLoaded) {
  isLoading = true;
  google.script.run
    .withSuccessHandler(displayCertificate)
    .withFailureHandler(displayError)
    .getCertificateByUUID(uuid);
} else if (!uuid || uuid === '') {
  displayError({ message: 'UUIDが指定されていません' });
}

function displayCertificate(data) {
  console.log('合格証データ取得成功:', data);
  isLoading = false;
  isLoaded = true;

  // データがnullまたは未定義の場合のエラー処理
  if (!data || !data.imageData) {
    displayError({ message: 'データが見つかりませんでした。合格証がまだ保存されていない可能性があります。' });
    return;
  }

  // グローバル変数に保存（ダウンロード時に使用）
  certificateData = data;

  var html = '';
  html += '<img src="' + data.imageData + '" class="certificate-image" id="certificateImg">';
  html += '<div style="margin-top:20px;">';
  html += '<button class="btn" onclick="downloadImage()">画像をダウンロード</button>';
  html += '</div>';

  document.getElementById('content').innerHTML = html;
}

function displayError(error) {
  console.error('合格証取得エラー:', error);
  isLoading = false;
  isLoaded = true; // エラー時もフラグを立てて再試行を防ぐ

  var html = '<div class="error">';
  html += '<strong>⚠️ エラー</strong><br>';
  html += (error.message || 'エラーが発生しました');
  html += '</div>';
  html += '<p>合格証が見つかりませんでした。</p>';
  html += '<p style="font-size:14px; color:#666; margin-top:20px;">考えられる原因:</p>';
  html += '<ul style="text-align:left; color:#666; font-size:13px;">';
  html += '<li>合格証がまだ生成されていない</li>';
  html += '<li>URLが正しくない</li>';
  html += '<li>データの保存に失敗した</li>';
  html += '</ul>';
  html += '<p style="font-size:12px; color:#999; margin-top:20px;">UUID: ' + uuid + '</p>';

  document.getElementById('content').innerHTML = html;

  // エラー後は再試行しない
  return;
}

function downloadImage() {
  if (!certificateData) {
    alert('合格証データが読み込まれていません');
    return;
  }

  var img = document.getElementById('certificateImg');
  var link = document.createElement('a');
  link.href = img.src;

  // ファイル名を生成: ニックネーム_ジャンル_レベル_日付.jpg
  var nickname = certificateData.nickname || 'unknown';
  var genre = certificateData.genre || 'unknown';
  var level = certificateData.level || 'unknown';

  // 日付から年月日を抽出（例: "Fri Dec 05 2025..." -> "20251205"）
  var dateStr = '';
  try {
    var date = new Date(certificateData.date);
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    dateStr = year + month + day;
  } catch (e) {
    dateStr = 'date';
  }

  // ファイル名に使えない文字を除去
  var safeNickname = nickname.replace(/[\\/:*?"<>|]/g, '_');
  var safeGenre = genre.replace(/[\\/:*?"<>|]/g, '_');
  var safeLevel = level.replace(/[\\/:*?"<>|]/g, '_');

  link.download = '合格証_' + safeNickname + '_' + safeGenre + '_' + safeLevel + '_' + dateStr + '.jpg';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
