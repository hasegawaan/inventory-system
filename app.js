// ===== 商品データ定義 =====
const CATEGORIES = [
  {
    id: 'siuzku',
    label: 'sizuku',
    gridId: 'siuzku-grid',
    countId: 'siuzku-count',
    lowStockThreshold: 10,
    perBox: 33,
    items: [
      'ゆず', 'リンゴ', 'オレンジカシス', '抹茶', '焙じ茶',
      'アールグレイ', 'テキーラ', 'xyz', 'ゴッドマザー',
      'くり', '洋梨', 'マンゴー'
    ]
  },
  {
    id: 'mizumari',
    label: 'mizumari',
    gridId: 'mizumari-grid',
    countId: 'mizumari-count',
    lowStockThreshold: 1,
    perBox: 25,
    items: ['ゆず', 'リンゴ', '焙じ茶', '栗', '抹茶', 'アールグレイ']
  },
  {
    id: 'tumiki',
    label: 'tumiki',
    gridId: 'tumiki-grid',
    countId: 'tumiki-count',
    lowStockThreshold: 1,
    perBox: 20,
    items: ['抹茶', '焙じ茶', 'ココア', 'シナモン', 'セロリ', 'ローズマリー', 'フェンネル', 'カルダモン']
  }
]

// ===== 状態 =====
let inventory = {}   // { "siuzku_ゆず": 5, ... }
let editMode = false
let db = null

// ===== Firebase 初期化 =====
firebase.initializeApp(FIREBASE_CONFIG)
db = firebase.database()

// リアルタイム同期
db.ref('inventory').on('value', snapshot => {
  const data = snapshot.val()
  if (data) {
    inventory = data
  } else {
    // 初回：デフォルト値（全商品10個）で初期化
    CATEGORIES.forEach(cat => {
      cat.items.forEach(item => {
        const key = `${cat.id}_${item}`
        inventory[key] = 10
      })
    })
    db.ref('inventory').set(inventory)
  }
  renderAll()
  updateLastUpdated()
})

// ===== レンダリング =====
function renderAll() {
  let hasLowStock = false

  CATEGORIES.forEach(cat => {
    const grid = document.getElementById(cat.gridId)
    const countEl = document.getElementById(cat.countId)
    let lowCount = 0

    grid.innerHTML = cat.items.map(item => {
      const key = `${cat.id}_${item}`
      const qty = inventory[key] ?? 0
      const isLow = qty <= cat.lowStockThreshold
      if (isLow) { hasLowStock = true; lowCount++ }

      return `
        <div class="item-card ${isLow ? 'low-stock' : ''}" id="card_${key}">
          <div class="item-name">${item}</div>
          <div class="item-bottom">
            <span class="item-qty ${isLow ? 'low' : ''}">${qty}</span>
            ${isLow ? '<span class="low-badge">在庫不足</span>' : ''}
          </div>
          <div class="edit-controls">
            <button class="btn-dec" onclick="changeQty('${key}', -1)" ${qty <= 0 ? 'disabled' : ''}>−</button>
            <span class="item-qty ${isLow ? 'low' : ''}">${qty}</span>
            <button class="btn-inc" onclick="changeQty('${key}', 1)">+</button>
          </div>
        </div>
      `
    }).join('')

    countEl.textContent = lowCount > 0
      ? `${lowCount}件 在庫不足`
      : `${cat.items.length}種類`
  })

  // 低在庫バナー
  const banner = document.getElementById('low-stock-banner')
  banner.classList.toggle('hidden', !hasLowStock)
}

// ===== 在庫変更 =====
function changeQty(key, delta) {
  const current = inventory[key] ?? 0
  const next = Math.max(0, current + delta)
  inventory[key] = next
  db.ref(`inventory/${key}`).set(next)
  renderAll()
}

// ===== 編集モード =====
function toggleEditMode() {
  document.getElementById('password-modal').classList.remove('hidden')
  setTimeout(() => document.getElementById('password-input').focus(), 100)
}

function confirmPassword() {
  const input = document.getElementById('password-input').value
  const errorEl = document.getElementById('password-error')
  if (input === EDIT_PASSWORD) {
    closePasswordModal()
    enterEditMode()
  } else {
    errorEl.classList.remove('hidden')
    document.getElementById('password-input').value = ''
    document.getElementById('password-input').focus()
  }
}

function closePasswordModal() {
  document.getElementById('password-modal').classList.add('hidden')
  document.getElementById('password-input').value = ''
  document.getElementById('password-error').classList.add('hidden')
}

function enterEditMode() {
  editMode = true
  document.body.classList.add('edit-mode')
  document.getElementById('edit-btn').textContent = '編集中'
  document.getElementById('edit-btn').classList.add('active')
  document.getElementById('exit-edit-btn').classList.remove('hidden')
}

function exitEditMode() {
  editMode = false
  document.body.classList.remove('edit-mode')
  document.getElementById('edit-btn').textContent = '編集'
  document.getElementById('edit-btn').classList.remove('active')
  document.getElementById('exit-edit-btn').classList.add('hidden')
}

// ===== 最終更新時刻 =====
function updateLastUpdated() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  document.getElementById('last-updated').textContent = `${h}:${m} 更新`
}

// Enterキーでモーダル確認
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePasswordModal()
})
