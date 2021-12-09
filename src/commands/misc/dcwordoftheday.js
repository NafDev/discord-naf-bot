/* eslint-disable */
import Canvas from 'canvas';

Canvas.registerFont('./resources/arial.ttf', { family: 'sans-serif' });
Canvas.registerFont('./resources/seguiemj.ttf', { family: 'sans-serif' });

/**
 * @param {Canvas.Canvas} canvas Canvas object
 * @param {String} text String to paint
 * @param {String} baseline ctx.textBaseline
 * @param {Number} spacing spacing from vertical edge of image
 * @param {Number} fontSize initial font size
 */
function applyText(canvas, text, baseline = 'top', spacing = 30) {
  const ctx = canvas.getContext('2d');
  const fontSize = parseInt(ctx.font, 10);
  // ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = baseline;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = fontSize / 8;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 2;
  ctx.strokeText(text, canvas.width / 2, spacing);
  ctx.fillStyle = 'white';
  ctx.fillText(text, canvas.width / 2, spacing);
}

/**
 * Don Cheadle's Word of the Day
 * @param {String} bottomText
 */
export default async function dcwd(bottomText) {
  const background = await Canvas.loadImage('./resources/doncheadle.jpg');
  const canvas = Canvas.createCanvas(background.width, background.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  ctx.font = `85px Arial`;
  applyText(canvas, 'Don Cheadle', 'bottom', 110);
  applyText(canvas, 'Word Of The Day', 'top', 110);

  const lines = seperateText(canvas, bottomText.trim());

  let yPos = canvas.height - 50;
  let textHeight = ctx.measureText('|').actualBoundingBoxAscent + ctx.measureText('|').actualBoundingBoxDescent;
  for (let line of lines.reverse()) {
    applyText(canvas, line, 'bottom', yPos);
    yPos -= textHeight;
  }

  return canvas.toBuffer();
}

/**
 * Get optimized lines and set context font
 * @param {Canvas.Canvas} canvas
 * @param {String} string
 */
function seperateText(canvas, string, maxFontSize = 80, minFontSize = 20) {
  const ctx = canvas.getContext('2d');
  // Get the font from the object, e.g. "Arial"
  const fontMatch = ctx.font.match(/\d+px (\D+)/i);
  const getCtxFont = (num) => `${num}px ${fontMatch[1]}`;
  const avgLineWidth = (lineArray) => {
    let sum = 0;
    for (let i = 0; i < lineArray.length; i++) {
      sum += ctx.measureText(lineArray[i]).width;
    }
    return sum / lineArray.length || 0;
  };
  ctx.font = getCtxFont(minFontSize);

  const maxWidth = canvas.width;
  const maxHeight = canvas.width * 0.75;
  var fontSize = maxFontSize;

  var maxLength = Math.floor(maxWidth / ctx.measureText('—').width);

  const words = string.split(' ');
  let originalLen = words.length;
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    if (word.length > maxLength) {
      let one = word.substring(0, word.length / 2).trim();
      let two = word.substring(word.length / 2).trim();
      words[i] = one;
      words.splice(i + 1, 0, two);
      i--;
    }
  }
  fontSize = originalLen < words.length ? minFontSize + 5 : maxFontSize + 5;
  var lineFormats = [];
  outerLoop: do {
    fontSize -= 5;
    ctx.font = getCtxFont(fontSize);
    let lines = [],
      line = [];
    lines.push(fontSize);
    var wordArr = [...words];
    const fontHeight = ctx.measureText('|').actualBoundingBoxAscent + ctx.measureText('|').actualBoundingBoxDescent;
    while (wordArr.length) {
      let newLine = line.join(' ') + ' ' + wordArr[0];
      if (Math.ceil(ctx.measureText(newLine).width) < maxWidth) {
        line.push(wordArr.shift());
        if (!wordArr.length) lines.push(line.join(' '));
      } else if (line.length) {
        lines.push(line.join(' '));
        line = [];
      } else break;
      if (fontSize > minFontSize && fontHeight * lines.length > maxHeight) {
        continue outerLoop;
      }
    }
    if (wordArr.length === 0) lineFormats.push(lines);
  } while (fontSize > minFontSize);

  let bestFormat,
    bestFontSize,
    bestDiff = maxWidth;
  const idealWidth = maxWidth * 0.7;
  for (let i = 0; i < lineFormats.length; i++) {
    ctx.font = getCtxFont(lineFormats[i][0]);
    let newWidth = avgLineWidth(lineFormats[i].slice(1));
    let newDiff = Math.abs(newWidth - idealWidth);
    if (newDiff < bestDiff) {
      bestFormat = lineFormats[i].slice(1);
      bestFontSize = lineFormats[i][0];
      bestDiff = newDiff;
    }
    if (bestFormat.length === 1) break;
  }
  ctx.font = getCtxFont(bestFontSize);
  return bestFormat;
}
