// The supplied map and image are references; video and notes stay local to this browser session.
let droneVideoUrl = null;
let droneVideoName = '';
const droneNotes = [];

const dronePage = () => `<section class="drone-section">
  <div class="drone-title"><div><span>UAV OBSERVATION / GIS</span><h2>无人机路段观测</h2><p>查看航拍影像、确认拍摄范围并记录观测情况</p></div><span class="demo-badge">示例数据 · 非实时</span></div>
  <div class="drone-summary"><div><small>观测路段</small><strong>高滩岩立交北侧</strong><span>内环快速路附近</span></div><div><small>影像来源</small><strong id="feed-status">${droneVideoUrl ? '本地视频' : '示例截图'}</strong><span>未接入实时传输</span></div><div><small>飞行状态</small><strong>未连接</strong><span>暂无遥测信息</span></div><div><small>位置数据</small><strong>截图定位</strong><span>坐标尚未接入</span></div></div>
  <div class="drone-grid"><article class="drone-card"><header><div><small>01 / AERIAL FEED</small><h3>无人机影像</h3></div><span class="signal">● 本地预览</span></header><div class="drone-screen"><img src="assets/drone-frame.png" alt="无人机俯视快速路的示例画面" ${droneVideoUrl ? 'hidden' : ''}><video controls playsinline ${droneVideoUrl ? '' : 'hidden'} aria-label="本地无人机视频"></video><div class="screen-label">UAV · ROAD OBSERVATION</div></div><div class="feed-footer"><div><strong>高滩岩立交北侧路段</strong><p class="feed-name"></p></div><label class="upload-button">选择无人机视频<input type="file" accept="video/*" aria-label="选择无人机视频"></label></div><div class="drone-actions"><button type="button" data-action="snapshot">保存当前画面</button><button type="button" data-action="reset">恢复示例截图</button></div><p class="media-note">支持选择浏览器可播放的视频文件；文件只在本机预览。画面保存为 PNG。</p><p class="drone-message" role="status" aria-live="polite"></p></article>
  <article class="drone-card"><header><div><small>02 / ROAD LOCATION</small><h3>路段位置</h3></div><span class="map-tag">重庆 · 沙坪坝</span></header><div class="map-frame"><img src="assets/gaotanyan-map.png" alt="高滩岩立交附近地图，标记为无人机拍摄路段的大致位置"><div class="drone-map-marker" role="img" aria-label="无人机拍摄位置，大致位于高滩岩立交北侧"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 11 7 7m14 4 4-4M11 21l-4 4m14-4 4 4M12 12h8v8h-8z"/><circle cx="6" cy="6" r="3"/><circle cx="26" cy="6" r="3"/><circle cx="6" cy="26" r="3"/><circle cx="26" cy="26" r="3"/></svg></div><span class="map-caption">无人机拍摄位置（示意）</span></div><div class="drone-actions map-actions"><button type="button" data-map="segment" aria-pressed="true">无人机位置</button><button type="button" data-map="original" aria-pressed="false">原始地图</button></div><div class="location-details"><div><small>位置</small><strong>高滩岩立交北侧</strong></div><div><small>附近地标</small><strong>重庆市第十一人民医院</strong></div><div><small>路段</small><strong>内环快速路附近</strong></div></div><p class="media-note">标记依据提供的截图近似放置，并非实时定位；坐标与交互式地图尚未接入。</p></article></div>
  <div class="drone-bottom"><article class="drone-card"><header><div><small>03 / MISSION CONTEXT</small><h3>任务与路段信息</h3></div><span class="map-tag">待接入</span></header><div class="mission-list"><div><span>观测任务</span><strong>快速路交通运行观察</strong></div><div><span>飞行设备 / 编号</span><strong>未连接</strong></div><div><span>飞行高度 / 速度</span><strong>暂无数据</strong></div><div><span>拍摄方向 / 时间</span><strong>待确认</strong></div></div><p class="media-note">连接设备或数据源后可补充真实飞行信息。</p></article>
  <article class="drone-card"><header><div><small>04 / OBSERVATION NOTES</small><h3>观测记录</h3></div><span class="map-tag">本次会话</span></header><form class="note-form"><label for="drone-note">记录路况或影像中的现象</label><div><input id="drone-note" maxlength="120" required placeholder="例如：右侧车道车辆密集"><button type="submit">添加记录</button></div></form><ul class="note-list"></ul><p class="media-note">记录仅保留在当前页面会话中，刷新后清除。</p></article></div>
</section>`;

routes.drone = { title: '无人机观测', kicker: '航拍影像与路段位置', render: dronePage };
const droneNav = document.createElement('button');
droneNav.type = 'button';
droneNav.dataset.route = 'drone';
droneNav.textContent = '无人机观测';
document.querySelector('.route-nav').append(droneNav);
droneNav.addEventListener('click', () => { location.hash = 'drone'; });

function setupDronePage() {
  const active = location.hash === '#drone';
  document.body.classList.toggle('drone-page-active', active);
  if (!active) return;
  const panel = document.querySelector('.drone-section');
  if (!panel || panel.dataset.ready) return;
  panel.dataset.ready = 'true';
  const video = panel.querySelector('video');
  const image = panel.querySelector('.drone-screen img');
  const name = panel.querySelector('.feed-name');
  const status = panel.querySelector('.drone-message');
  const input = panel.querySelector('input[type=file]');
  const syncFeed = () => {
    video.hidden = !droneVideoUrl;
    image.hidden = !!droneVideoUrl;
    if (droneVideoUrl) video.src = droneVideoUrl;
    else { video.pause(); video.removeAttribute('src'); video.load(); }
    name.textContent = droneVideoUrl ? `本地视频：${droneVideoName}` : '当前展示用户提供的航拍截图';
    panel.querySelector('#feed-status').textContent = droneVideoUrl ? '本地视频' : '示例截图';
  };
  syncFeed();
  input.addEventListener('change', () => {
    if (!input.files.length) return;
    if (droneVideoUrl) URL.revokeObjectURL(droneVideoUrl);
    droneVideoUrl = URL.createObjectURL(input.files[0]);
    droneVideoName = input.files[0].name;
    syncFeed();
    status.textContent = '视频已载入，请使用播放器控制播放。';
  });
  video.addEventListener('error', () => { status.textContent = '无法播放此视频，请尝试浏览器支持的格式。'; });
  panel.querySelector('[data-action=reset]').addEventListener('click', () => {
    if (droneVideoUrl) URL.revokeObjectURL(droneVideoUrl);
    droneVideoUrl = null; droneVideoName = ''; input.value = ''; syncFeed(); status.textContent = '已恢复示例截图。';
  });
  panel.querySelector('[data-action=snapshot]').addEventListener('click', () => {
    const source = droneVideoUrl ? video : image;
    const width = droneVideoUrl ? video.videoWidth : image.naturalWidth;
    const height = droneVideoUrl ? video.videoHeight : image.naturalHeight;
    if (!width || !height) { status.textContent = '画面尚未准备好，请稍后再试。'; return; }
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d').drawImage(source, 0, 0, width, height);
    const link = document.createElement('a'); link.download = '无人机观测画面.png'; link.href = canvas.toDataURL('image/png'); link.click();
    status.textContent = '已保存当前画面。';
  });
  panel.querySelectorAll('[data-map]').forEach(button => button.addEventListener('click', () => {
    const marked = button.dataset.map === 'segment';
    const map = panel.querySelector('.map-frame img');
    map.alt = marked ? '高滩岩立交附近地图，标记为无人机拍摄路段的大致位置' : '高滩岩立交附近原始地图';
    panel.querySelector('.drone-map-marker').hidden = !marked;
    panel.querySelector('.map-caption').textContent = marked ? '无人机拍摄位置（示意）' : '原始位置图';
    panel.querySelectorAll('[data-map]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  const list = panel.querySelector('.note-list');
  const drawNotes = () => {
    list.replaceChildren();
    if (!droneNotes.length) { const li = document.createElement('li'); li.textContent = '暂无观测记录'; list.append(li); return; }
    droneNotes.forEach(note => { const li = document.createElement('li'); li.textContent = `${note.time}  ·  ${note.text}`; list.append(li); });
  };
  drawNotes();
  panel.querySelector('.note-form').addEventListener('submit', event => {
    event.preventDefault(); const field = panel.querySelector('#drone-note'); const value = field.value.trim();
    if (!value) return;
    droneNotes.unshift({ time: new Date().toLocaleTimeString('zh-CN', {hour12:false}), text: value }); field.value = ''; drawNotes();
  });
}
window.addEventListener('hashchange', setupDronePage);
document.querySelector('#login-form').addEventListener('submit', () => setTimeout(setupDronePage, 0));
if (location.hash === '#drone') { renderRoute(); setupDronePage(); }
