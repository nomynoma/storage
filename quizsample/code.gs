function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('クイズアプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * セクションごとの問題を取得
 * @param {string} sectionName - "初級", "中級", "上級"
 * @returns {Array} ランダム10問
 */
function getQuestions(sectionName) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sectionName);
    if (!sheet) throw new Error(sectionName + 'シートが見つかりません');

    var data = sheet.getDataRange().getValues();
    var allQuestions = [];

    for (var i = 1; i < data.length; i++) {
      if (!data[i][3]) continue; // 問題文が空ならスキップ

      allQuestions.push({
        number: data[i][0] || i,
        selectionType: (data[i][1] || 'single').toString().trim().toLowerCase(), // single or multiple
        displayType: (data[i][2] || 'text').toString().trim().toLowerCase(),    // text or image
        question: data[i][3] || '',
        choiceA: data[i][4] || '',
        choiceB: data[i][5] || '',
        choiceC: data[i][6] || '',
        choiceD: data[i][7] || '',
        answer: (data[i][8] || '').toString().trim().toUpperCase()
      });
    }

    // ランダムに10問選ぶ
    var selectedQuestions = [];
    var indices = [];
    for (var i = 0; i < allQuestions.length; i++) indices.push(i);

    // Fisher-Yatesシャッフル
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = indices[i];
      indices[i] = indices[j];
      indices[j] = temp;
    }

    var selectCount = Math.min(10, allQuestions.length);
    for (var i = 0; i < selectCount; i++) {
      var q = allQuestions[indices[i]];

      // 選択肢を配列にまとめる
      var choices = [
        { label: 'A', text: q.choiceA },
        { label: 'B', text: q.choiceB },
        { label: 'C', text: q.choiceC },
        { label: 'D', text: q.choiceD }
      ];

      // 元の正解ラベルを記憶
      var originalCorrectLabels = q.answer.split(',').map(a => a.trim().toUpperCase());

      // 選択肢をシャッフル
      for (var k = choices.length - 1; k > 0; k--) {
        var l = Math.floor(Math.random() * (k + 1));
        var tmp = choices[k];
        choices[k] = choices[l];
        choices[l] = tmp;
      }

      // シャッフル後の正解ラベルを更新
      var newAnswer = [];
      choices.forEach((c, idx) => {
        // 元のラベルで正解なら、新しいラベル(A,B,C,D)に変換
        var originalLabel = ['A','B','C','D'][idx]; // 新しい位置に対応するラベル
        if (originalCorrectLabels.includes(c.label)) {
          newAnswer.push(originalLabel);
        }
      });

      // 選択肢テキストを更新
      q.choiceA = choices[0].text;
      q.choiceB = choices[1].text;
      q.choiceC = choices[2].text;
      q.choiceD = choices[3].text;
      q.answer = newAnswer.join(',');

      selectedQuestions.push(q);
    }

    return selectedQuestions;

  } catch (error) {
    Logger.log('エラー: ' + error.toString());
    throw new Error('問題の読み込みに失敗しました: ' + error.toString());
  }
}
