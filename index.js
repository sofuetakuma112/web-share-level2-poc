const secureContextOutput = document.querySelector('#secure-context');
const shareApiOutput = document.querySelector('#share-api');
const canShareApiOutput = document.querySelector('#can-share-api');
const iframeNotice = document.querySelector('#iframe-notice');
const openDirectlyLink = document.querySelector('#open-directly');
const titleInput = document.querySelector('#title-input');
const textInput = document.querySelector('#text-input');
const fileInput = document.querySelector('#file-input');
const sampleButton = document.querySelector('#sample-button');
const fileSummary = document.querySelector('#file-summary');
const shareButton = document.querySelector('#share-button');
const resultOutput = document.querySelector('#result');
const diagnosticsOutput = document.querySelector('#diagnostics');

let selectedFiles = [];

function isEmbedded() {
  return window.self !== window.top;
}

function setPill(output, supported) {
  output.textContent = supported ? '利用可能' : '利用不可';
  output.classList.toggle('pill-supported', supported);
  output.classList.toggle('pill-unsupported', !supported);
}

function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getShareData() {
  const shareData = {};

  if (titleInput.value.trim().length > 0) {
    shareData.title = titleInput.value;
  }

  if (textInput.value.trim().length > 0) {
    shareData.text = textInput.value;
  }

  if (selectedFiles.length > 0) {
    shareData.files = selectedFiles;
  }

  return shareData;
}

function getShareSupport(shareData) {
  if (!window.isSecureContext) {
    return {
      supported: false,
      message: 'HTTPSではないため、Web Share APIを利用できません。',
    };
  }

  if (typeof navigator.share !== 'function') {
    return {
      supported: false,
      message: 'このブラウザまたはOSはnavigator.shareに対応していません。',
    };
  }

  if (Object.keys(shareData).length === 0) {
    return {
      supported: false,
      message: 'タイトル、本文、またはファイルを指定すると共有可否を判定します。',
    };
  }

  const includesFiles = 'files' in shareData;
  if (includesFiles && typeof navigator.canShare !== 'function') {
    return {
      supported: false,
      message: 'このブラウザはファイル共有可否を判定できません。',
    };
  }

  if (typeof navigator.canShare !== 'function') {
    return {
      supported: true,
      message: 'navigator.shareが利用できます。共有時にブラウザが内容を確認します。',
    };
  }

  try {
    // 実際にshare()へ渡すタイトル、本文、ファイルの組み合わせをまとめて判定する。
    if (navigator.canShare(shareData)) {
      return {
        supported: true,
        message: 'navigator.canShare(共有データ)がtrueを返しました。',
      };
    }

    return {
      supported: false,
      message: isEmbedded()
        ? 'iframeのPermissions Policyで共有が許可されていない可能性があります。別タブで開いてください。'
        : 'navigator.canShare(共有データ)がfalseを返しました。ブラウザ、OS、または指定した内容の組み合わせが未対応です。',
    };
  } catch (error) {
    return {
      supported: false,
      message: `共有可否の判定中に${getErrorName(error)}が発生しました。`,
    };
  }
}

function getErrorName(error) {
  return error instanceof DOMException || error instanceof Error ? error.name : 'UnknownError';
}

function renderEnvironment() {
  setPill(secureContextOutput, window.isSecureContext);
  setPill(shareApiOutput, typeof navigator.share === 'function');
  setPill(canShareApiOutput, typeof navigator.canShare === 'function');

  iframeNotice.hidden = !isEmbedded();
  openDirectlyLink.href = window.location.href;
  diagnosticsOutput.textContent = [
    `URL: ${window.location.href}`,
    `Secure Context: ${window.isSecureContext}`,
    `Top-level: ${!isEmbedded()}`,
    `navigator.share: ${typeof navigator.share}`,
    `navigator.canShare: ${typeof navigator.canShare}`,
    `User-Agent: ${navigator.userAgent}`,
  ].join('\n');
}

function renderShareState() {
  fileSummary.replaceChildren();

  if (selectedFiles.length === 0) {
    fileSummary.textContent = 'ファイルが選択されていません。';
  } else {
    const list = document.createElement('ul');
    list.className = 'file-list';

    for (const file of selectedFiles) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const metadata = document.createElement('span');

      name.textContent = file.name;
      metadata.textContent = `${file.type || '形式不明'} · ${formatBytes(file.size)}`;
      item.append(name, metadata);
      list.append(item);
    }

    fileSummary.append(list);
  }

  const support = getShareSupport(getShareData());
  shareButton.disabled = !support.supported;
  resultOutput.textContent = support.message;
  resultOutput.className = support.supported ? 'result result-success' : 'result';
}

function describeShareError(error) {
  switch (getErrorName(error)) {
    case 'AbortError':
      return '共有がキャンセルされました。';
    case 'NotAllowedError':
      return '共有が許可されませんでした。ページを直接開き、ボタン操作から実行してください。';
    case 'InvalidStateError':
      return '別の共有処理が実行中か、ページがアクティブではありません。';
    case 'TypeError':
      return 'ファイル形式または共有データがブラウザに拒否されました。';
    default:
      return `共有に失敗しました: ${getErrorName(error)}`;
  }
}

async function createSampleImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Canvasを初期化できませんでした。');
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#4338ca');
  gradient.addColorStop(1, '#06b6d4');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = '700 48px system-ui, sans-serif';
  context.textAlign = 'center';
  context.fillText('Web Share API', canvas.width / 2, 165);
  context.font = '28px system-ui, sans-serif';
  context.fillText('File sharing PoC', canvas.width / 2, 215);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob === null) {
    throw new Error('画像を作成できませんでした。');
  }

  return new File([blob], 'web-share-level-2-poc.png', {
    type: 'image/png',
    lastModified: Date.now(),
  });
}

fileInput.addEventListener('change', () => {
  selectedFiles = Array.from(fileInput.files ?? []);
  renderShareState();
});

titleInput.addEventListener('input', renderShareState);
textInput.addEventListener('input', renderShareState);

sampleButton.addEventListener('click', async () => {
  sampleButton.disabled = true;

  try {
    selectedFiles = [await createSampleImage()];
    fileInput.value = '';
    renderShareState();
  } catch (error) {
    resultOutput.textContent = error instanceof Error ? error.message : '画像を作成できませんでした。';
    resultOutput.className = 'result result-error';
  } finally {
    sampleButton.disabled = false;
  }
});

shareButton.addEventListener('click', async () => {
  const shareData = getShareData();
  const support = getShareSupport(shareData);
  if (!support.supported) {
    renderShareState();
    return;
  }

  resultOutput.textContent = '共有シートを開いています…';
  resultOutput.className = 'result';

  try {
    // ユーザー操作の中でshare()を呼び出し、入力された共有データをまとめて渡す。
    await navigator.share(shareData);
    resultOutput.textContent = '共有処理が完了しました。';
    resultOutput.className = 'result result-success';
  } catch (error) {
    resultOutput.textContent = describeShareError(error);
    resultOutput.className = 'result result-error';
  }
});

renderEnvironment();
renderShareState();
