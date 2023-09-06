import Sortable from '/javascripts/sortable.core.esm.js';

//use sortablejs on the container element for the image tags
let list = document.querySelector('div');
let sort = Sortable.create(list);

let convertButton = document.querySelector('a.convert');

//When the convert button is clicked
convertButton.onclick = function(){
	let images = document.querySelectorAll('img');
	let loader = document.querySelector('span.loader');
	let convertText = document.querySelector('span.text');
	let downloadButton = document.querySelector('a.download');
	
	let filenames = [];
	//extract the image names into an array
	for(let image of images){
		filenames.push(image.dataset.name)
	}
	//activate loading animation
	loader.style.display = 'inline-block';
	convertText.style.display = 'none'
	
	//Create a post request that'll send the image filenames to the '/pdf' route and receive the link to the PDF file
	fetch('/pdf', {
		method: 'POST',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(filenames)
	})
	.then( (resp)=> {
		return resp.text()
	})
	.then( (data) => {
        //stop the loading animation
		loader.style.display = 'none';
		
        //display the convert and download button
		convertText.style.display = 'inline-block'
		downloadButton.style.display = 'inline-block'
		
        //attach the address to the download button
		downloadButton.href = data
	})
	.catch( (error) => {
		console.error(error.message)
	})	
}