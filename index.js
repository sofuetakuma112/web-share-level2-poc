const secureContextOutput = document.querySelector('#secure-context');
const shareApiOutput = document.querySelector('#share-api');
const canShareApiOutput = document.querySelector('#can-share-api');
const iframeNotice = document.querySelector('#iframe-notice');
const openDirectlyLink = document.querySelector('#open-directly');
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

function getFileShareSupport() {
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

  if (typeof navigator.canShare !== 'function') {
    return {
      supported: false,
      message: 'このブラウザはファイル共有可否を判定できません。',
    };
  }

  if (selectedFiles.length === 0) {
    return {
      supported: false,
      message: 'ファイルを選択すると共有可否を判定します。',
    };
  }

  try {
    // Level 2の判定対象であるfilesだけを渡し、ほかの共有データの影響を受けないようにする。
    if (navigator.canShare({ files: selectedFiles })) {
      return {
        supported: true,
        message: 'navigator.canShare({ files })がtrueを返しました。',
      };
    }

    return {
      supported: false,
      message: isEmbedded()
        ? 'iframeのPermissions Policyで共有が許可されていない可能性があります。別タブで開いてください。'
        : 'navigator.canShare({ files })がfalseを返しました。ブラウザ、OS、ファイル形式のいずれかが未対応です。',
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

function renderFiles() {
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

  const support = getFileShareSupport();
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
  renderFiles();
});

sampleButton.addEventListener('click', async () => {
  sampleButton.disabled = true;

  try {
    selectedFiles = [await createSampleImage()];
    fileInput.value = '';
    renderFiles();
  } catch (error) {
    resultOutput.textContent = error instanceof Error ? error.message : '画像を作成できませんでした。';
    resultOutput.className = 'result result-error';
  } finally {
    sampleButton.disabled = false;
  }
});

shareButton.addEventListener('click', async () => {
  const support = getFileShareSupport();
  if (!support.supported) {
    renderFiles();
    return;
  }

  resultOutput.textContent = '共有シートを開いています…';
  resultOutput.className = 'result';

  try {
    // ユーザー操作の中でshare()を呼び出し、選択済みのファイルだけを共有する。
    await navigator.share({ files: selectedFiles });
    resultOutput.textContent = '共有処理が完了しました。';
    resultOutput.className = 'result result-success';
  } catch (error) {
    resultOutput.textContent = describeShareError(error);
    resultOutput.className = 'result result-error';
  }
});

renderEnvironment();
renderFiles();
