/**
 * jQuery Billboard v1.2
 *
 * Terms of Use - jQuery Billboard
 * under the MIT (http://www.opensource.org/licenses/mit-license.php) License.
 *
 * Copyright 2010-2013 Steve Palmer All rights reserved.
 * (https://github.com/spalmer/Billboard)
 *
 */
 
;(function($) {

	$.fn.billboard = function( options, args ) {
	
		var 
			wrapper = $(this);
		
		// selector is empty
		if( ! wrapper.length ) 
		{
			return;
		}
		
		// element has already billboard'd
		if( wrapper.data("billboard") )
		{
			// check if it's a method being called
			if( typeof options == "string" && typeof wrapper.data("billboard")[options] == "function" )
			{
				wrapper.data("billboard")[options].apply(this, args);
			}
			
			return wrapper.data("billboard");
		}
		
		wrapper
			.addClass("billboard")
			.data("billboard", this);
			
		// default options
		var defaults = {
		
			// behaviour
			easing: 					"easeInOutExpo",	// animation ease of transitions
			speed: 						1000,			// duration of transitions in milliseconds
			duration: 				5000,			// time between slide changes
			autoplay: 				true,			// whether slideshow should play automatically
			loop: 						true,			// whether slideshow should loop (only applies if autoplay is true)
			transition: 			"left", 	// "fade", "up", "down", "left", "right"

			// appearance
			navType: 					"list", 	// "controls", "list", "both" or "none"
			styleNav: 				true,			// applies default styles to nav
			includeFooter: 		true,			// show/hide footer (contains caption and nav)
			autosize:					true,			// attempts to detect slideshow size automatically
			resize: 					false,		// resize container based on each slide's width/height (used with autosize:true) 	
			stretch:					true,			// stretch images to fill container
			
			// callbacks
			onSlideChange:		function(){},
			onClickDotNav:		function(){},
			onClickNext: 			function(){},
			onClickPrev: 			function(){},
			onClickPause: 		function(){},
			onClickPlay: 			function(){},
			onInit:						function(){},
			onStart:					function(){}
		};

		var plugin = this;
		plugin.settings = {}

		// variables
		var 
			slides			= $( "> ul > li", wrapper ),
			numSlides 	= slides.length,
			numLoaded		= 0,
			firstRun 		= true,
			curSlide 		= 0,
			prevSlide 	= 0,
			interval		= 0,
			paused 			= false,
			reverse 		= false,	
			x_start 		= 0,
			x_end 			= 0,
			y_start 		= 0,
			y_end 			= 0,	
			startDelay 	= 200,
			slideTitle
		;
		
		// extra elements
		var 
			footer 					= $('<footer class="billboard-footer"></footer>'),
			caption 				= $('<p class="billboard-caption"></p>'),
			listNav 				= $('<nav class="list"></nav>'),
			controlsNav 		= $('<nav class="controls"></nav>'),
			ratioDiv				= $('<div class="aspect-ratio" />');

		// control elements
		var 
			btnNext 				= $('<a href="#" class="control next" title="Next">Next</a>'),
			btnPrev 				= $('<a href="#" class="control prev" title="Previous">Previous</a>'),
			btnPause	 			= $('<a href="#" class="control play pause" title="Pause">Pause</a>');
		

		/*************************************
		 * Constructor
		 */
		 
		var _init = function() 
		{
			plugin.settings = $.extend({}, defaults, options);
	
			// single slide
			if( numSlides <= 1 ) 
			{
				wrapper
					.addClass("billboard-activated billboard-single");
				_setSize();
				return;
			}
			
			slides
				.css("visibility", "hidden");
			
			wrapper
				.on("slideLoaded", function(e, $slide) {
					numLoaded++;
					
					if( numLoaded == numSlides )
					{
						// start
						wrapper
							.trigger("allSlidesLoaded");
					}
					
				})
				.on("allSlidesLoaded", function() {
					
					var
						firstSlide = $( "> ul > li:first", wrapper );						
				
					if( ! plugin.settings.resize )
					{
						ratioDiv
							.css( { paddingTop: ( 1 / slides.eq(curSlide).data("aspectRatio") * 100 ) + "%" } );
					}
				
					_start();		

				})
				.on("swipeleft", function() {
					if( plugin.settings.transition == "left" )
						_playNextSlide();
					if( plugin.settings.transition == "right" )
						_playPrevSlide();
				})
				.on("swiperight", function() {
					if( plugin.settings.transition == "left" )
						_playPrevSlide();
					if( plugin.settings.transition == "right" )
						_playNextSlide();
				})
				.on("swipeup", function() {
					if( plugin.settings.transition == "up" )
						_playNextSlide();
					if( plugin.settings.transition == "down" )
						_playPrevSlide();				
				})
				.on("swipedown", function() {
					if( plugin.settings.transition == "up" )
						_playPrevSlide();
					if( plugin.settings.transition == "down" )
						_playNextSlide();				
				});				
			
			// start it up
			_buildInterface();
			
			$(window)
				.on("resize", function() {
					_windowResizeHandler();
				});
			
			// init callback
			plugin
				.settings
				.onInit
				.apply(wrapper, arguments);
				
		}
		
		/*************************************
		 * Public methods
		 */
		 
		plugin.play = function() 
		{
			_play();
		};		
		plugin.pause = function() 
		{
			_pause();
		};		
		plugin.resume = function() 
		{
			_resume();
		};
		plugin.goto = function( $index ) 
		{
			_gotoSlide( $index );
		};
		plugin.get = function( $index )	
		{
			return _getSlide( $index );
		};
		plugin.sleep = function()
		{
			_sleep();
		}	
		plugin.wake = function()
		{
			_wake();
		}
	 			
		/*************************************
		 * Private methods
		 */
		 
		// start
		var _start = function() {
		
			plugin
				.ready = true;
					
			wrapper
				.addClass("billboard-activated")
				.addClass( plugin.settings.autosize ? "billboard-autosize" : "billboard-fixedsize" )
				.addClass( plugin.settings.stretch ? "billboard-stretch" : "" );

			// add footer, caption and nav
			if( plugin.settings.includeFooter ) 
			{
				footer
					.appendTo(wrapper);
				caption
					.appendTo(footer);
				
				// build nav
				switch( plugin.settings.navType ) 
				{	
					case "controls":
						_addNavControls();
						break;
					case "list":
						_addNavList();
						break;
					case "both":
						_addNavControls();
						_addNavList();
						break;
					case "none":
						// none
						break;
				}	
			}

			// load first slide
			setTimeout(function() {
				slides
					.css("visibility", "visible");
				_play();
			}, startDelay);
			
			// init callback
			plugin
				.settings
				.onStart
				.apply(wrapper, arguments);
		} 

  	// build interface
		var _buildInterface = function() 
		{
			var
				firstSlide = $( "> ul > li:first", wrapper );
				
			// style nav
			if(plugin.settings.styleNav) 
			{
				$(listNav)
					.addClass("billboard-styled");
				$(controlsNav)
					.addClass("billboard-styled");
			}
			
			_setSize();
			
			// init first slide position
			switch( plugin.settings.transition )
			{
				case "left":
					firstSlide
						.css( "left", "100%" );
					break;
				case "right":
					firstSlide
						.css( "left", "-100%" );
					break;
				case "up":
					firstSlide
						.css( "top", "-100%" );
					break;
				case "down":
					firstSlide
						.css( "top", "100%" );
					break;
			}
				
			// aspect ratio
			ratioDiv
				.appendTo(wrapper);
			slides
				.each(function() {
					$(this)	
						.wrapInner( '<div class="billboard-slide"></div>' );
				});			
				
			// pause button behaviours
			btnPause
				.click(function(e) 
				{
					e.preventDefault();
					_pause();
				});
			
			// next button behaviours	
			btnNext
				.click(function(e) 
				{
					e.preventDefault();

					_reset();
					_playNextSlide();

					plugin
						.settings
						.onClickPrev
						.apply(wrapper, [curSlide, prevSlide, arguments]);
				});
				
			// prev button behaviours	
			btnPrev
				.click(function(e) 
				{
					e.preventDefault();

					_reset();
					_playPrevSlide();

					plugin
						.settings
						.onClickNext
						.apply(wrapper, [curSlide, prevSlide, arguments]);
				});
					
		}
		
		var _windowResizeHandler = function() 
		{
			var
				slide = slides.eq(curSlide);
				
			_updateBillboardSize( slide );			
		}

		// set width/height to first slide dimensions
		var _setSize = function() 
		{
			slides
				.each(function() {
					_calculateSlideSize( $(this) );
				});
		}
		
		var _calculateSlideSize = function( $slide )
		{
			var
				images = $("img", $slide),
				numImages = images.length,
				isPhoto = false,
				parent = $slide.find(".billboard-slide").length ? $slide.find(".billboard-slide").first() : $slide,
				children = parent.children(),
				grandchildren = children.first().children();
			
			if ( children.length == 1 )
			{
				if ( children.first().prop("tagName") == "IMG" )
				{
					isPhoto = true;
				}
				else if ( 
					grandchildren.length == 1 && 
					grandchildren.first().prop("tagName") == "IMG" &&
					children.first().text == ""
				)
				{
					isPhoto = true;
				}
			}
			
			$slide
				.data("isPhoto", isPhoto)
				.data("numImages", numImages)
				.data("imagesLoaded", 0);
			
			if( numImages > 0 )
			{
				images
					.one("load", function() {
						$slide
							.data("imagesLoaded", $slide.data("imagesLoaded") + 1);
						if( $slide.data("imagesLoaded") == numImages )
						{
							_getSlideSize( $slide );
						}						
					})
					.each(function() {
					  if( this.complete ) 
					  {
					  	$(this)
					  		.load();
					  }
					});					
			}
			else 
			{
				_getSlideSize( $slide );
			}	
				
		}
		
		var _getSlideSize = function( $slide )
		{
			var
				clone,
				container,
				aspectRatio;
				
			clone = $slide.clone();
			clone
				.appendTo("body")
				.addClass("billboard-size-clone")
				.css({ visibility: "hidden", position: "absolute", width: wrapper.width() })
				.each(function() {
					aspectRatio = $(this).width() / $(this).height();	
				})
				.remove();
				
			$slide
				.data("aspectRatio", aspectRatio)
				.data("slideWidth", $slide.outerWidth())
				.data("slideHeight", $slide.outerHeight());
				
			wrapper
				.trigger("slideLoaded", [ $slide ]);		
		}
		
		var _updateBillboardSize = function( $slide )
		{
			var
				slideAspectRatio,
				wrapperAspectRatio;
		
			// handle size changes
			if( plugin.settings.resize ) 
			{
				if( ! $slide.data("isPhoto") )
				{
					// not photo slide - do not obey old aspect ratio
					_getSlideSize( $slide );
				}
				ratioDiv
					.stop()
					.animate(
						{ paddingTop: ( 1 / $slide.data("aspectRatio") * 100 ) + "%" },
						{ 
							duration: plugin.settings.speed,
							easing: plugin.settings.easing
						}
					);
			}
			else if ( $slide.data("aspectRatio") )
			{
				wrapperAspectRatio = Math.floor( wrapper.width() / wrapper.height() * 1000 )  / 1000;
				slideAspectRatio = Math.floor( $slide.data("aspectRatio") * 1000 )  / 1000;
				
				$slide
					.removeClass("billboard-portrait billboard-landscape")
					.addClass( wrapperAspectRatio > slideAspectRatio ? "billboard-portrait" : "billboard-landscape" );
			}
		}
		
		var _addNavControls = function() 
		{
			// prev/pause/next
			controlsNav
				.appendTo(footer)
				.append(btnPrev)
				.append(btnPause)
				.append(btnNext);
		}
		
		var _addNavList = function() 
		{
			// clickable button for each slide
			listNav
				.appendTo(footer);
			
			var 
				item;
				
			$("> ul > li", wrapper)
				.each(function(i) {
					slideTitle = $(this).attr("title") != '' ? ' <span class="title">' + $(this).attr("title") + '</span>' : '';
					item = $('<a href="#" class="dot" rel="' + i + '"><span class="index">' + (i+1) + '</span>' + slideTitle + '</a>');
					
					item
						.click(function(e) {	
							e.preventDefault();
						
							prevSlide = curSlide;
							curSlide = parseInt($(this).attr("rel"));

							if( prevSlide == curSlide ) 
							{	
								return;
							}
							
							_reset();
							_play();
							
							plugin
								.settings
								.onClickDotNav
								.apply(wrapper, [curSlide, prevSlide, arguments]);
								
						})
						.appendTo(listNav);
				});
		}

		// reset autoplay
		var _reset = function()
		{
			if( plugin.settings.autoplay && ! paused ) 
			{
				clearInterval(interval);
				interval = setInterval(_playNextSlide, plugin.settings.duration);
			}
		}
		
		// go to next slide
		var _playNextSlide = function() 
		{
			if( plugin.settings.navType != "list" ) 
			{
				reverse = false;
			}
			
			prevSlide = curSlide;
			curSlide == ( numSlides - 1 ) ? curSlide = 0 : curSlide++;
			
			if( plugin.settings.autoplay && curSlide == 0 && ! plugin.settings.loop ) 
			{
				clearInterval(interval);
				return; 
			}
			
			_play();	
		}
		
		// go to prev slide
		var _playPrevSlide = function() 
		{
			if(plugin.settings.navType != "list") 
			{	
				reverse = true;
			}
			
			prevSlide = curSlide;
			curSlide == 0 ? curSlide = ( numSlides - 1 ) : curSlide--;
			_play();
		}
		
		// go to slide
		var _gotoSlide = function( $index )
		{
			_reset();
			if( $index >= 0 && $index < numSlides && $index != curSlide ) 
			{
				if( plugin.settings.navType != "list" ) 
				{
					reverse = $index < curSlide;
				}
				
				prevSlide = curSlide;
				curSlide = $index;
				_play();
			}
		}
		
		// get slide N
		var _getSlide = function( $index )
		{
			$index += 1; // 1-based indexing
			if( $index > numSlides ) 
				return;
			
			var 
				slide = $("> ul > li:nth-child(" + $index + ") > img", wrapper).length ? $("> ul > li:nth-child(" + $index + ") > img", wrapper) : $("> ul > li:nth-child(" + $index + ")", wrapper);
			
			return slide;
		}
		
		// pause
		var _pause = function() {
			if( ! paused ) 
			{
				paused = true;	
				
				if(plugin.settings.autoplay) 
				{	
					clearInterval(interval);
				}
				
				btnPause
					.removeClass("pause")
					.text("Play")
					.attr("title", "Play");
				
				plugin
					.settings
					.onClickPause
					.apply(wrapper, [curSlide, prevSlide, arguments]);	
			
			}
			else
			{
				paused = false;
				
				_reset();
				_playNextSlide();
				
				btnPause
					.addClass("pause")
					.text("Pause")
					.attr("title", "Pause");
				
				plugin
					.settings
					.onClickPlay
					.apply(wrapper, [curSlide, prevSlide, arguments]);			
			}
		}
		
		// resume
		var _resume = function() 
		{
			if( paused ) 
			{
				_reset();
				paused = false;
				btnPause
					.addClass("pause");
			}
		}	
		
		// sleep
		var _sleep = function()
		{
			if( plugin.settings.autoplay ) 
			{
				clearInterval(interval);
			}
		}
		
		// wake
		var _wake = function()
		{
			if( ! paused ) 
			{
				_reset();
			}
		}
		
		// go to curSlide
		var _play = function() 
		{
			var
				slide = slides.eq(curSlide);
		
			// determine animation direction
			if( plugin.settings.navType == "list" ) 
			{
				reverse = ! ( 
					( curSlide > prevSlide ) || 
					( curSlide == 0 && prevSlide == ( numSlides - 1 ) ) || 
					( curSlide == prevSlide && curSlide == 0 ) 
				);
			}
			
			// slide change callback
			plugin
				.settings
				.onSlideChange
				.apply(wrapper, [curSlide, prevSlide, reverse, arguments]);				
				
			_updateBillboardSize( slide );
			
			// animate slides
			slides
				.each(function(thisSlide) { 
					// set caption
					if( thisSlide == curSlide && plugin.settings.includeFooter ) 
					{
						slideTitle = $(this).attr("title");
						$(".billboard-caption", wrapper)
							.fadeOut(plugin.settings.speed * 0.5, function(){
								if( slideTitle ) 
								{
									$(this)
										.text(slideTitle)
										.fadeIn(plugin.settings.speed * 0.5);
								}
							});
					} 
					// advance slide
					switch( plugin.settings.transition ) {
						case "fade":
							if( thisSlide == curSlide ) 
							{
								$(this)
									.animate(
										{ opacity: "show" },
										{ duration: plugin.settings.speed }
									);
							} 
							else 
							{
								$(this)
									.animate(
										{ opacity: "hide" }, 
										{ duration: plugin.settings.speed }
									);
							}
							break;
						case "left":
						case "right":
							if( thisSlide == curSlide || thisSlide == prevSlide ) 
							{
								x_start = ( thisSlide == curSlide ) ? 100 * (reverse ? -1 : 1) : 0;
								x_end = ( thisSlide == curSlide ) ? 0 : -100 * (reverse ? -1 : 1);
								if( plugin.settings.transition == "right") 
								{
									x_start *= -1;
									x_end *= -1;
								}
								$(this)
									.css("left", x_start + "%")
									.css("z-index", ( thisSlide == curSlide ? numSlides + 100 : 1 ))
									.animate(
										{ "left": x_end + "%" }, 
										{
											duration: plugin.settings.speed,
											easing: plugin.settings.easing,
											queue: false
										}
									)
									.show();
							} else 
							{
								$(this)
									.hide();
							}					
							break;
						case "up":
						case "down":
							if( thisSlide == curSlide || thisSlide == prevSlide ) 
							{
								y_start = (thisSlide == curSlide) ? 100 * (reverse ? -1 : 1) : 0;
								y_end = (thisSlide == curSlide) ? 0 : -100 * (reverse ? -1 : 1);
								if( plugin.settings.transition == "down" ) 
								{
									y_start *= -1;
									y_end *= -1;
								}
								$(this)
									.css("top", y_start + "%")
									.css("z-index", (thisSlide == curSlide ? numSlides+100 : 1))
									.animate(
										{ "top": y_end + "%" }, 
										{
											duration: plugin.settings.speed,
											easing: plugin.settings.easing,
											queue: false
										}
									)
									.show();
							} else 
							{
								$(this)
									.hide();
							}	
							break;					
					}
				// set current item in list nav
				if( plugin.settings.includeFooter ) 
				{
					if( thisSlide == curSlide ) 
					{
						$("a[rel=" + thisSlide + "]", listNav)
							.addClass("active");
					} 
					else 
					{
						$("a[rel=" + thisSlide + "]", listNav)
							.removeClass("active");			
					}
				}
				
			});
			_reset();
		}		
		
  	// constructor	
  	_init();	

	}
  
})( jQuery );