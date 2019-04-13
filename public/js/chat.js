const socket = io()

// Elements (cleaner code)
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML // get access to the HTML code in script
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML // get access to the HTML code in script
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true}) // remove question mark

const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild

	// Height of the last message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// Visible height
	const visibleHeight = $messages.offsetHeight

	// Height of messages container 全長
	const containerHeight = $messages.scrollHeight

	// How far have I scrolled?
	// scrollTop 看不見(上半部)的部分 滑動了多少
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on('message', (message) => {
	console.log(message)
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	}) // store the final html to be rendered
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

socket.on('locationMessage', (message) => {
	console.log(message)
	const html = Mustache.render(locationMessageTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')
	}) // store the final html to be rendered
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

socket.on('roomData', ({room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault()

	$messageFormButton.setAttribute('disabled', 'disabled')

	// disable
	const message = e.target.elements.message.value
	// target: what e is listening to (here is the form)
	socket.emit('sendMessage', message, (error) => { // acknowledgment
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus() 
		// enable

		if (error) {
			return console.log(error)
		}
		console.log('Message delivered!')
	})
})

$sendLocationButton.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser.')
	}
	$sendLocationButton.setAttribute('disabled', 'disabled')

	// most modern brower has this feature
	navigator.geolocation.getCurrentPosition((position) => {
		console.log(position)
		socket.emit('sendLocation', {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}, () => {
			$sendLocationButton.removeAttribute('disabled')
			console.log('Location shared!')
		})
	})
})

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
})

// socket.on('countUpdated', (count) => {
// 	console.log('The count has been updated!', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
// 	console.log('Clicked')
// 	socket.emit('increment')
// })

