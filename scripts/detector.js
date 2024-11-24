const checkAccount = (urlName, name, checkName) => {
  const nameUsed = checkName ? urlName : name
  chrome.runtime.sendMessage(
    //goes to bg_page.js
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${nameUsed}.bsky.social`,
    (data) => {
      const jsonData = JSON.parse(data)
      console.log(jsonData)
      if (jsonData.error === 'InvalidRequest') {
        console.log('NO ACC: ', nameUsed)
        if (checkName) {
          checkAccount(urlName, name, false)
        }
      } else {
        const existingLabel = document.querySelector('#TwitterToBlueSkyProfileLabel')
        if (existingLabel) {
          existingLabel.remove()
        }
        const label = document.createElement('div')
        label.id = 'TwitterToBlueSkyProfileLabel'
        const link = document.createElement('a')
        link.innerText = 'BLUESKY ACCOUNT'
        link.href = `https://bsky.app/profile/${nameUsed}.bsky.social`
        label.appendChild(link)
        const target = document.querySelector('[data-testid="UserName"]')
        target.appendChild(label)
      }
    },
  )
}

window.navigation.addEventListener('navigate', (event) => {
  console.log('location changed!')
  let loaded = false
  const id = setInterval(() => {
    const urlName = window.location.pathname.split('/').pop().toLocaleLowerCase()
    const target = document.querySelector('[data-testid="UserName"]')
    if (target) {
      const name = target.querySelector('span').innerText.toLocaleLowerCase()
      console.log(urlName, name)
      if (target) {
        checkAccount(urlName, name, true)
        loaded = true
        clearInterval(id)
      }
    }
  }, 500)
})
