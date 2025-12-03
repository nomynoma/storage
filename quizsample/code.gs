function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('クイズアプリ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * セクション名を指定してランダム10問を取得
 * @param {string} section "beginner" | "intermediate" | "advanced"
 */
function getQuestions(section) {
  try {
    let sheetName = '';
    switch(section.toLowerCase()) {
      case 'beginner': sheetName = 'Beginner'; break;
      case 'intermediate': sheetName = 'Intermediate'; break;
      case 'advanced': sheetName = 'Advanced'; break;
      default: throw new Error('不正なセクション名: ' + section);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if(!sheet) throw new Error('シートが見つかりません: ' + sheetName);

    const data = sheet.getDataRange().getValues();
    const allQuestions = [];

    for(let i=1; i<data.length; i++){
      if(!data[i][3]) continue; // 問題文が空ならスキップ

      allQuestions.push({
        number: data[i][0],
        selectionType: String(data[i][1]).trim().toLowerCase(), // single/multiple
        displayType: String(data[i][2]).trim().toLowerCase(), // text/image
        question: data[i][3],
        choices: [data[i][4], data[i][5], data[i][6], data[i][7]],
        answer: String(data[i][8]).trim().toUpperCase() // "A,B" など
      });
    }

    // ランダムに10問抽出
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, allQuestions.length));

    // 選択肢シャッフルと正解ラベル変換
    selected.forEach(q => {
      const originalChoices = [...q.choices];
      const labels = ['A','B','C','D'];

      // 元インデックスをシャッフル
      const shuffledIndices = [0,1,2,3].sort(() => 0.5 - Math.random());

      // choiceMap作成（表示ラベル → 選択肢）
      q.choiceMap = {};
      shuffledIndices.forEach((origIdx, i) => {
        const label = labels[i];
        q.choiceMap[label] = originalChoices[origIdx];
      });

      // 正解ラベルをシャッフル後の表示ラベルに変換
      const originalCorrect = q.answer.split(',').map(a => a.trim());
      const newCorrectLabels = [];
      shuffledIndices.forEach((origIdx, i) => {
        if(originalCorrect.includes(labels[origIdx])){
          newCorrectLabels.push(labels[i]);
        }
      });
      q.answer = newCorrectLabels.join(',');
    });

    return selected;

  } catch (error) {
    Logger.log('エラー: ' + error.toString());
    throw new Error('問題の読み込みに失敗しました: ' + error.toString());
  }
}
