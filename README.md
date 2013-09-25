# Billboard

A simple, robust jQuery plugin to create responsive slideshows.

## Installation

Include the JS file *after* the jQuery library:

    <script src="/path/to/jquery.billboard.min.js"></script>

Include the stylesheet in the `head` section of the document:

    <link rel="stylesheet" href="/path/to/jquery.billboard.css">


## Usage

The basic syntax is this:

```javascript
$("#myBillboard")
	.billboard(options);
```

The selector can be any jQuery selector and the default options are:

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