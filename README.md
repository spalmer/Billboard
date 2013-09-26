# Billboard

A simple, robust jQuery plugin to create responsive slideshows.

## Installation

Include the JS file *after* the jQuery library:

    <script src="/path/to/jquery.billboard.min.js"></script>

Include the stylesheet in the `head` section of the document:

    <link rel="stylesheet" href="/path/to/jquery.billboard.css">

## Examples

Check out [some demos](http://spalmer.github.io/Billboard/demo)

## Usage

The basic syntax is this:

```javascript
$("#myBillboard")
	.billboard(options);
```

The selector can be any jQuery selector and the default options are:

```javascript
var defaults = {
	easing: "easeInOutExpo", // animation ease of transitions
	speed: 1000, // duration of transitions in milliseconds
	duration: 5000, // time between slide changes
	autoplay: true, // whether slideshow should play automatically
	loop: true, // whether slideshow should loop (only applies if autoplay is true)
	transition: "left", // "fade", "up", "down", "left", "right"
	navType: "list", // "controls", "list", "both" or "none"
	
	styleNav: true, // applies default styles to nav
	includeFooter: true, // show/hide footer (contains caption and nav)
	autosize: true, // attempts to detect slideshow size automatically
	resize: false, // resize container based on each slide's width/height (used with autosize:true) 	
	stretch: true, // stretch images to fill container
	
	onSlideChange: function(){},
	onClickDotNav: function(){},
	onClickNext: function(){},
	onClickPrev: function(){},
	onClickPause: function(){},
	onClickPlay: function(){},
	onInit: function(){},
	onStart: function(){}
};
```

## Methods

Methods are accessed in one of two ways:

```javascript
$("#myBillboard")
	.billboard("method", [arg1, arg2, arg3]);
```

```javascript
$("#myBillboard")
	.billboard()
	.method([arg1, arg2, arg3]);
```

The available methods are:

- `play()`
- `pause()`
- `resume()`
- `goto(n)` where "n" is the 0-based index of the slide
- `get(n)` returns the slide at index "n"
- `sleep`
- `wake`

## Callbacks

Callbacks are defined in the options when the billboard is created:

```javascript
$("#myBillboard")
	.billboard({
		onSlideChange: slideChangeHandler
	});

function slideChangeHandler( curSlide, prevSlide, reverse, args )
{
	/*
	curSlide: index of the slide being switched to
	prevSlide: index of the slide being switched from
	reverse: boolean indicating whether direction from prevSlide to curSlide is reverse or not
	*/
	var slide = $(this).billboard().get(curSlide);
	
	...
	
}	
```

The available callbacks are:

-
-
-

## Authors

[Steve Palmer](https://github.com/spalmer)