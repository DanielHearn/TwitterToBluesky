console.log('load')

const getBskyNameFromString = (string = '') => {
  return string.match(/\/?(\w+)\.bsky\.social$/gi)
}

const addAccountLink = (url) => {
  const existingLabel = document.querySelector('#TwitterToBlueSkyProfileLabel')
  if (existingLabel) {
    existingLabel.remove()
  }
  const label = document.createElement('div')
  label.id = 'TwitterToBlueSkyProfileLabel'
  label.className = 'TwitterToBlueSkyProfile'
  const link = document.createElement('a')
  link.innerText = 'BlueSky Profile'
  link.href = url
  label.appendChild(link)
  const target = document.querySelector('[data-testid="UserName"]')
  target.appendChild(label)
}

const checkAccount = (urlName, name, checkName) => {
  let nameUsed = checkName ? urlName : name
  const matchUrlName = getBskyNameFromString(urlName)
  if (matchUrlName?.length) {
    nameUsed = matchUrlName[0].split('.bsky.social')[0]
    addAccountLink(`https://bsky.app/profile/${nameUsed}.bsky.social`)
    return
  } else {
    const matchName = getBskyNameFromString(name)
    if (matchName?.length) {
      nameUsed = matchName[0].split('.bsky.social')[0]
      addAccountLink(`https://bsky.app/profile/${nameUsed}.bsky.social`)
      return
    }
  }
  chrome.runtime.sendMessage(
    //goes to bg_page.js
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${nameUsed}.bsky.social`,
    (data) => {
      const jsonData = JSON.parse(data)
      if (jsonData.error === 'InvalidRequest') {
        if (checkName) {
          checkAccount(urlName, name, false)
        }
      } else {
        addAccountLink(`https://bsky.app/profile/${nameUsed}.bsky.social`)
      }
    },
  )
}

function sendMessage(name) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${name}.bsky.social`,
      resolve,
    )
  })
}

const getAccount = async (urlName, name) => {
  const data1 = await sendMessage(urlName)
  const jsonData1 = JSON.parse(data1)
  if (jsonData1.error === 'InvalidRequest') {
    const data2 = await sendMessage(name)
    const jsonData2 = JSON.parse(data2)
    if (jsonData2.error === 'InvalidRequest') {
      return false
    } else {
      return name
    }
  } else {
    return urlName
  }
}

const checkFollowingPage = async () => {
  const listElements = document.querySelectorAll(
    '[data-testid="primaryColumn"] > div > section > div > div > div',
  )
  for (const element of listElements) {
    const target = element.querySelector('span')
    const profileLink = element.querySelector('a')?.href
    if (
      target &&
      profileLink &&
      !profileLink.includes('search') &&
      !profileLink.includes('explore') &&
      !element.querySelector('.TwitterToBlueSkyFollowingLabel') &&
      !element.querySelector('.TwitterToBlueSkyNoAccount')
    ) {
      const linkName = profileLink.split('/')[0]
      const name = element.querySelector('span').innerText
      const matchLinkName = getBskyNameFromString(linkName)
      const matchName = getBskyNameFromString(name)
      let account = null
      if (matchLinkName?.length) {
        account = matchLinkName[0].split('.bsky.social')[0]
      } else if (matchName?.length) {
        account = matchName[0].split('.bsky.social')[0]
      }
      if (!account) {
        account = await getAccount(linkName, name)
      }
      if (account) {
        const existingLabel = element.querySelector('.TwitterToBlueSkyFollowingLabel')
        if (existingLabel) {
          existingLabel.remove()
        }
        const label = document.createElement('div')
        label.className = 'TwitterToBlueSkyFollowingLabel'
        const link = document.createElement('a')
        link.innerText = 'BlueSky Profile'
        link.href = `https://bsky.app/profile/${account}.bsky.social`
        label.appendChild(link)
        target.appendChild(label)
      } else {
        const existingLabel = element.querySelector('.TwitterToBlueSkyFollowingLabel')
        if (existingLabel) {
          existingLabel.remove()
        }
        const label = document.createElement('div')
        label.className = 'TwitterToBlueSkyNoAccount'
        target.appendChild(label)
      }
    }
  }
}

const checkProfilePage = () => {
  const id = setInterval(() => {
    const urlName = window.location.pathname.split('/')[1].toLocaleLowerCase()
    const target = document.querySelector('[data-testid="UserName"]')
    if (target) {
      const name = target.querySelector('span').innerText.toLocaleLowerCase()
      if (name) {
        checkAccount(urlName, name, true)
        clearInterval(id)
      }
    }
  }, 100)
}

const checkPage = () => {
  if (!document.querySelector('.TwitterToBlueSkyStyles')) {
    document.querySelector('head').appendChild(styles)
  }
  const existingLabels = document.querySelectorAll(
    '.TwitterToBlueSkyProfile, .TwitterToBlueSkyFollowingLabel',
  )
  for (const label of existingLabels) {
    if (label) {
      label.remove()
    }
  }
  clearInterval(followingId)
  const id = setTimeout(() => {
    if (window.location.pathname.split('/')[2] === 'following') {
      setInterval(() => {
        if (window.location.pathname.split('/')[2] === 'following') {
          checkFollowingPage()
        }
      }, 1000)
    } else {
      checkProfilePage()
    }
  }, 200)
}

const styles = document.createElement('style')
styles.className = 'TwitterToBlueSkyStyles'
styles.innerHTML = `
[data-testid="UserName"] {
  gap: 6px;
}

.TwitterToBlueSkyProfile, .TwitterToBlueSkyFollowingLabel {
  padding: 0.5em;
  border-radius: 6px;
  background: #0085ff;
  font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI";
  display: flex;
  height: max-content;
  a {
    text-decoration: none;
    color: white;
    font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI";
    &:visited {
      color: white;
      text-decoration: none;
    }
  }
}`

document.querySelector('head').appendChild(styles)
let followingId = null

window.navigation.addEventListener('navigate', (event) => {
  checkPage()
})
window.navigation.addEventListener('load', (event) => {
  checkPage()
})

checkPage()
