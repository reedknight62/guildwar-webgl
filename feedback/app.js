'use strict';
const params = new URLSearchParams(location.search);
const context = {};
for (const [key, label] of [['version', '游戏版本'], ['build', '构建编号'], ['platform', '平台']]) {
  context[key] = (params.get(key) || '未提供').slice(0, 120);
  const term = document.createElement('dt');
  const value = document.createElement('dd');
  term.textContent = label;
  value.textContent = context[key];
  document.querySelector('#context').append(term, value);
}
const form = document.querySelector('#form');
const button = document.querySelector('#submit');
const result = document.querySelector('#result');
const input = document.querySelector('#description');
let submitUrl = null;
try {
  const configured = window.FEEDBACK_CONFIG?.submitUrl;
  if (configured) {
    const parsed = new URL(configured);
    if (parsed.protocol === 'https:') submitUrl = parsed.href;
  }
} catch { /* Leave submission disabled for invalid configuration. */ }
document.querySelector('#availability').textContent = submitUrl
  ? '反馈服务已接通，可以提交问题。'
  : '网页已打开。目前先测试访问和版本预填，提交服务尚未接通。';
if (submitUrl) { button.disabled = false; button.textContent = '提交反馈'; }
const requestId = crypto.randomUUID();
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!submitUrl) { result.textContent = '提交服务尚未接通，你的文字没有上传。'; return; }
  const description = input.value.trim();
  if (!description) { result.textContent = '请先描述遇到的问题。'; return; }
  button.disabled = true;
  input.readOnly = true;
  button.textContent = '正在提交…';
  result.textContent = '';
  try {
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: window.FEEDBACK_CONFIG.publishableKey },
      body: JSON.stringify({ requestId, description, context }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '未能确认提交成功，请稍后重试。');
    if (!Number.isSafeInteger(data.number) || data.number < 1) throw new Error('未能确认提交成功，请稍后重试。');
    result.style.color = '#466449';
    result.textContent = '提交成功，问题编号：#' + data.number + '。开发者已收到。';
    form.hidden = true;
  } catch (error) {
    result.style.color = '#9b4040';
    result.textContent = (error.name === 'TimeoutError' || error.name === 'TypeError'
      ? '未能确认提交成功，请检查网络后重试。' : error.message) + ' 你的文字已保留。';
    button.disabled = false;
    button.textContent = '重新提交';
  }
});
