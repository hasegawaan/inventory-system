// ===== 商品データ =====
const CATEGORIES = [
  {
    id: 'siuzku', label: 'sizuku', gridId: 'siuzku-grid', countId: 'siuzku-count',
    lowStockThreshold: 10, perBox: 33,
    items: ['ゆず','リンゴ','オレンジカシス','抹茶','焙じ茶','アールグレイ','テキーラ','xyz','ゴッドマザー','くり','洋梨','マンゴー']
  },
  {
    id: 'mizumari', label: 'mizumari', gridId: 'mizumari-grid', countId: 'mizumari-count',
    lowStockThreshold: 1, perBox: 25,
    items: ['ゆず','リンゴ','焙じ茶','栗','抹茶','アールグレイ']
  },
  {
    id: 'tumiki', label: 'tumiki', gridId: 'tumiki-grid', countId: 'tumiki-count',
    lowStockThreshold: 1, perBox: 20,
    items: ['抹茶','焙じ茶','ココア','シナモン','セロリ','ローズマリー','フェンネル','カルダモン']
  }
]

// ===== 資材データ（固定）=====
const SHIZAI_CATEGORIES = [
  {
    id: 'yamabun', label: '山末さん', colorClass: 'cat-yamabun',
    items: [
      { key: 'sleeve_box',      name: 'スリーブ箱（下箱と蓋セット）', delivery: '3週間', unit: '10,000', defaultNote: '' },
      { key: 'paper_cushion',   name: 'ペーパークッション',           delivery: '4週間', unit: '3,000',  defaultNote: '' },
      { key: 'box3',            name: '3個箱',                        delivery: '3週間', unit: '相談',   defaultNote: '' },
      { key: 'tea_manual',      name: '紅茶説明書',                   delivery: '1週間', unit: '4,500',  defaultNote: '' },
      { key: 'shop_card',       name: 'ショップカード',               delivery: '1週間', unit: '3,000',  defaultNote: '' },
      { key: 'check_sheet',     name: 'チェックシート',               delivery: '1週間', unit: '相談',   defaultNote: '切り替わる予定のため相談' },
      { key: 'vinyl_small',     name: 'ビニール袋（小）',             delivery: '3週間', unit: '10,000', defaultNote: '' },
      { key: 'vinyl_large',     name: 'ビニール袋（大）',             delivery: '3週間', unit: '',       defaultNote: '' },
      { key: 'tea_box',         name: '茶箱',                         delivery: '3週間', unit: '',       defaultNote: '' },
      { key: 'tea_box_base',    name: '茶箱底上げ',                   delivery: '3週間', unit: '',       defaultNote: '' },
      { key: 'macaron_box6',    name: 'マカロン6個箱',                delivery: '3週間', unit: '10,000', defaultNote: '' },
      { key: 'dosuimoku_box1',  name: '土水木1個箱',                  delivery: '3週間', unit: '5,000',  defaultNote: '' },
    ]
  },
  {
    id: 'zapack', label: 'ザパック', colorClass: 'cat-zapack',
    items: [
      { key: 'paper_bag', name: '紙袋', delivery: '4週間', unit: '6,000', defaultNote: '' },
    ]
  },
  {
    id: 'kyowa', label: '協和', colorClass: 'cat-kyowa',
    items: [
      { key: 'divider6',  name: '金色6個仕切り',  delivery: '3週間', unit: '', defaultNote: '2つ合わせて10,000' },
      { key: 'divider12', name: '金色12個仕切り', delivery: '3週間', unit: '', defaultNote: '2つ合わせて10,000' },
    ]
  },
  {
    id: 'amushuti', label: 'アムシュティ', colorClass: 'cat-amushuti',
    items: [
      { key: 'tea', name: '紅茶', delivery: '2週間', unit: '3,000', defaultNote: '' },
    ]
  },
  {
    id: 'gyomu', label: '業務スーパー', colorClass: 'cat-gyomu',
    items: [
      { key: 'aluminum_foil', name: '試食アルミホイル', delivery: '', unit: '', defaultNote: '' },
    ]
  },
  {
    id: 'amazon', label: 'アマゾン', colorClass: 'cat-amazon',
    items: [
      { key: 'expiry_label', name: '賞味期限シール（ラベラー用）', delivery: '3日', unit: '', defaultNote: '' },
      { key: 'expiry_stamp', name: '賞味期限シール（スタンプ用）', delivery: '3日', unit: '', defaultNote: '' },
    ]
  },
]

// ===== 状態 =====
let inventory = {}
let shizaiInventory = {}
let shizaiNotes = {}
let editMode = false
let currentTab = 'chocolate'
let pendingQtyKey = null
let pendingQtyIsShizai = false
let db = null

// ===== Firebase =====
firebase.initializeApp(FIREBASE_CONFIG)
db = firebase.database()

db.ref('inventory').on('value', snapshot => {
  const data = snapshot.val()
  if (data) {
    inventory = data
  } else {
    CATEGORIES.forEach(cat => {
      cat.items.forEach(item => { inventory[`${cat.id}_${item}`] = 10 })
    })
    db.ref('inventory').set(inventory)
  }
  renderChocolate()
  updateLastUpdated()
})

db.ref('shizai_inventory').on('value', snapshot => {
  const data = snapshot.val() || {}
  SHIZAI_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const key = `${cat.id}_${item.key}`
      shizaiInventory[key] = data[key] ?? 0
    })
  })
  if (currentTab === 'shizai') renderShizai()
})

db.ref('shizai_notes').on('value', snapshot => {
  shizaiNotes = snapshot.val() || {}
  if (currentTab === 'shizai' && !editMode) renderShizai()
})

// ===== タブ切り替え =====
function switchTab(tab) {
  if (editMode) exitEditMode()
  currentTab = tab
  document.getElementById('section-chocolate').classList.toggle('hidden', tab !== 'chocolate')
  document.getElementById('section-shizai').classList.toggle('hidden', tab !== 'shizai')
  document.getElementById('tab-chocolate').classList.toggle('active', tab === 'chocolate')
  document.getElementById('tab-shizai').classList.toggle('active', tab === 'shizai')
  document.getElementById('low-stock-banner').classList.add('hidden')
  if (tab === 'shizai') renderShizai()
  if (tab === 'chocolate') renderChocolate()
}

// ===== 商品レンダリング =====
function renderChocolate() {
  if (currentTab !== 'chocolate') return
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
        <div class="item-card ${isLow ? 'low-stock' : ''}">
          <div class="item-name">${item}</div>
          <div class="item-bottom">
            <span class="item-qty ${isLow ? 'low' : ''}">${qty}</span>
            ${isLow ? '<span class="low-badge">在庫不足</span>' : ''}
          </div>
          <div class="edit-controls">
            <button class="btn-dec" onclick="changeQty('${key}',-1)" ${qty<=0?'disabled':''}>−</button>
            <button class="qty-btn" onclick="openQtyModal('${key}',false)">${qty}</button>
            <button class="btn-inc" onclick="changeQty('${key}',1)">+</button>
          </div>
        </div>`
    }).join('')
    countEl.textContent = lowCount > 0 ? `${lowCount}件 在庫不足` : `${cat.items.length}種類`
  })
  document.getElementById('low-stock-banner').classList.toggle('hidden', !hasLowStock)
}

// ===== 資材レンダリング =====
function renderShizai() {
  const tbody = document.getElementById('shizai-tbody')
  let rows = ''
  SHIZAI_CATEGORIES.forEach((cat, catIdx) => {
    cat.items.forEach((item, itemIdx) => {
      const key = `${cat.id}_${item.key}`
      const qty = shizaiInventory[key] ?? 0
      const note = shizaiNotes[key] ?? item.defaultNote
      const isCatStart = catIdx > 0 && itemIdx === 0
      rows += `
        <tr class="${isCatStart ? 'cat-start' : ''}">
          ${itemIdx === 0 ? `<td class="td-cat ${cat.colorClass}" rowspan="${cat.items.length}">${cat.label}</td>` : ''}
          <td class="td-name">${item.name}</td>
          <td class="td-delivery">${item.delivery}</td>
          <td class="td-unit">${item.unit}</td>
          <td class="td-qty">
            <span class="shizai-qty">${qty}</span>
            <div class="shizai-controls">
              <button class="btn-dec-s" onclick="changeShizaiQty('${key}',-1)" ${qty<=0?'disabled':''}>−</button>
              <button class="qty-btn-s" onclick="openQtyModal('${key}',true)">${qty}</button>
              <button class="btn-inc-s" onclick="changeShizaiQty('${key}',1)">+</button>
            </div>
          </td>
          <td class="td-note" data-key="${key}" ${editMode?'contenteditable="true"':''}>${note}</td>
        </tr>`
    })
  })
  tbody.innerHTML = rows
  if (editMode) {
    document.querySelectorAll('.td-note[contenteditable="true"]').forEach(td => {
      td.addEventListener('blur', () => {
        const key = td.dataset.key
        const text = td.textContent.trim()
        shizaiNotes[key] = text
        db.ref(`shizai_notes/${key}`).set(text || null)
      })
    })
  }
}

// ===== 在庫変更 =====
function changeQty(key, delta) {
  const next = Math.max(0, (inventory[key] ?? 0) + delta)
  inventory[key] = next
  db.ref(`inventory/${key}`).set(next)
  renderChocolate()
}

function changeShizaiQty(key, delta) {
  const next = Math.max(0, (shizaiInventory[key] ?? 0) + delta)
  shizaiInventory[key] = next
  db.ref(`shizai_inventory/${key}`).set(next)
  renderShizai()
}

// ===== 数量モーダル =====
function openQtyModal(key, isShizai) {
  pendingQtyKey = key
  pendingQtyIsShizai = isShizai
  const qty = isShizai ? (shizaiInventory[key] ?? 0) : (inventory[key] ?? 0)
  document.getElementById('qty-modal-input').value = qty
  document.getElementById('qty-modal').classList.remove('hidden')
  setTimeout(() => {
    const inp = document.getElementById('qty-modal-input')
    inp.focus(); inp.select()
  }, 100)
}

function closeQtyModal() {
  document.getElementById('qty-modal').classList.add('hidden')
  pendingQtyKey = null
}

function confirmQty() {
  if (!pendingQtyKey) return
  const val = Math.max(0, parseInt(document.getElementById('qty-modal-input').value) || 0)
  if (pendingQtyIsShizai) {
    shizaiInventory[pendingQtyKey] = val
    db.ref(`shizai_inventory/${pendingQtyKey}`).set(val)
    renderShizai()
  } else {
    inventory[pendingQtyKey] = val
    db.ref(`inventory/${pendingQtyKey}`).set(val)
    renderChocolate()
  }
  closeQtyModal()
}

// ===== 編集モード =====
function toggleEditMode() {
  const label = currentTab === 'chocolate' ? '商品ラインナップ' : '資材'
  document.getElementById('pw-modal-title').textContent = label + ' — パスワードを入力'
  document.getElementById('password-input').value = ''
  document.getElementById('password-error').classList.add('hidden')
  document.getElementById('password-modal').classList.remove('hidden')
  setTimeout(() => document.getElementById('password-input').focus(), 100)
}

function confirmPassword() {
  const input = document.getElementById('password-input').value
  const correct = currentTab === 'chocolate' ? EDIT_PASSWORD : EDIT_PASSWORD_SHIZAI
  if (input === correct) {
    closePasswordModal()
    enterEditMode()
  } else {
    document.getElementById('password-error').classList.remove('hidden')
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
  if (currentTab === 'shizai') renderShizai()
}

function exitEditMode() {
  editMode = false
  document.body.classList.remove('edit-mode')
  document.getElementById('edit-btn').textContent = '編集'
  document.getElementById('edit-btn').classList.remove('active')
  document.getElementById('exit-edit-btn').classList.add('hidden')
  if (currentTab === 'shizai') renderShizai()
}

// ===== 最終更新時刻 =====
function updateLastUpdated() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  document.getElementById('last-updated').textContent = `${h}:${m} 更新`
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePasswordModal(); closeQtyModal() }
  if (e.key === 'Enter' && !document.getElementById('qty-modal').classList.contains('hidden')) confirmQty()
})
