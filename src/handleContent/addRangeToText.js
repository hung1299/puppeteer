exports.addRangeToText = ({ document, window, textNode, text }) => {
    const range = document.createRange();
    const selection = window.getSelection();
    const startIndex = textNode.wholeText.lastIndexOf(text);
    const endIndex = startIndex + text.length;

    range.setStart(textNode, startIndex);
    range.setEnd(textNode, endIndex);

    selection.removeAllRanges();
    selection.addRange(range);
};
