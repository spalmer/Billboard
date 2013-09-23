/**
 * jQuery Billboard v1.1
 *
 * Terms of Use - jQuery Billboard
 * under the MIT (http://www.opensource.org/licenses/mit-license.php) License.
 *
 * Copyright 2010-2013 Steve Palmer All rights reserved.
 * (https://github.com/spalmer/Billboard)
 *
 */
 
// TO DO
/*

	- handle vertical images that are alone in slides
	- figure out why all slideshows other than first two are hidden


*/
 
;(function($) {

	$.billboard = function(el, options) {
	
		var 
			wrapper = $(el);
		if( ! wrapper.length || wrapper.hasClass("billboard-activated") ) return;
		wrapper
			.addClass("billboard");
			
		// default options
		var defaults = {
			ease: 						"easeInOutExpo",	// animation ease of transitions
			speed: 						1000,			// duration of transitions in milliseconds
			duration: 				5000,			// time between slide changes
			autoplay: 				true,			// whether slideshow should play automatically
			loop: 						true,			// whether slideshow should loop (only applies if autoplay is true)
			transition: 			"left", 	// "fade", "up", "down", "left", "right"
			navType: 					"list", 	// "controls", "list", "both" or "none"
			
			styleNav: 				true,			// applies default styles to nav
			includeFooter: 		true,			// show/hide footer (contains caption and nav)
			autosize:					true,		// attempts to detect slideshow size automatically
			resize: 					false,		// resize container based on each slide's width/height (used with autosize:true) 	
			
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
			title,
			loadDelay 	= 200;
		
		// extra elements
		var 
			footer 					= $('<footer class="billboard-footer"></footer>'),
			caption 				= $('<p class="billboard-caption"></p>'),
			listNav 				= $('<nav class="list"></nav>'),
			controlsNav 		= $('<nav class="controls"></nav>');

		// control elements
		var 
			nav_next 				= $('<a href="#" class="control next" title="Next">Next</a>'),
			nav_prev 				= $('<a href="#" class="control prev" title="Previous">Previous</a>'),
			nav_pause 			= $('<a href="#" class="control play pause" title="Pause/Play">Pause/Play</a>');
		

		/*************************************
		 * Constructor
		 */
		 
		var _init = function() 
		{
			plugin.settings = $.extend({}, defaults, options);
			plugin.el = el;
	
			// single slide
			if( numSlides <= 1 ) 
			{
				wrapper
					.addClass("billboard-activated billboard-single");
				_setSize();
				return;
			}
			
			wrapper
				.on("slideLoaded", function(e, $slide) {
					numLoaded++;
					
					if( plugin.settings.resize ) 
					{
						if( numLoaded == numSlides )
						{
							// start
							wrapper
								.trigger("allSlidesLoaded");
						}
					}
					else 
					{
						if( numLoaded )
						{
							// start
							wrapper
								.trigger("allSlidesLoaded");
						}
					}
					
				})
				.on("allSlidesLoaded", function() {
					
					var
						firstSlide = $( "> ul > li:first", wrapper );						
				
					if( ! plugin.settings.resize )
					{
						wrapper
							.width( firstSlide.data("slideWidth") )
							.height( firstSlide.data("slideHeight") );
					}
				
					_start();		

				});			
			
			// start it up
			_buildInterface();
			
			// init callback
			plugin
				.settings
				.onInit
				.apply(wrapper, arguments);
				
			if( plugin.settings.autosize )
			{
				_start();
			}	
				
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
				.addClass("billboard-activated " + ( plugin.settings.autosize ? "billboard-autosize" : "billboard-fixedsize"));

			// load first slide
			_play();				

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
				$(listNav).addClass("billboard-styled");
				$(controlsNav).addClass("billboard-styled");
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
				
			// hide all slides
			$("> ul > li", wrapper)
				.hide();

			// pause button behaviours
			$(nav_pause)
				.click(function(e) 
				{
					e.preventDefault();
					
					if(paused)
					{
						_playNextSlide();
						if(plugin.settings.autoplay) interval = setInterval(_playNextSlide, plugin.settings.duration);
						paused = false;
						$(this)
							.addClass("pause");
						plugin.settings.onClickPlay.apply(wrapper, [curSlide, prevSlide, arguments]);
					} else 
					{
						if(plugin.settings.autoplay) clearInterval(interval);
						paused = true;
						$(this)
							.removeClass("pause");
						plugin.settings.onClickPause.apply(wrapper, [curSlide, prevSlide, arguments]);
					}
				});
			
			// next button behaviours	
			$(nav_next)
				.click(function(e) 
				{
					e.preventDefault();

					_reset();
					_playNextSlide();
					plugin.settings.onClickPrev.apply(wrapper, [curSlide, prevSlide, arguments]);
				});
				
			// prev button behaviours	
			$(nav_prev)
				.click(function(e) 
				{
					e.preventDefault();

					_reset();
					_playPrevSlide();
					plugin.settings.onClickNext.apply(wrapper, [curSlide, prevSlide, arguments]);
				});
					
		}

		// set width/height to first slide dimensions
		var _setSize = function() 
		{
			var
				firstSlide = slides.eq(0);

			if( plugin.settings.autosize ) 
			{
				if( plugin.settings.resize ) 
				{
					slides
						.each(function() {
							_getSlideSize( $(this) );
						});
				}
				else 
				{
					_getSlideSize( firstSlide );
				}
			}
					
/*		
			if( ! firstRun) loadDelay = 0;
			firstRun = false;
			
			// rewrite this to calculate the aspect ratio for each slide
			// by counting all the images and checking the slide width/height when they're all loaded
			// if resize is true, change size every slide
			// if resize is false, set size based on first slide
			
			if(plugin.settings.autosize) 
			{
				setTimeout(function(){ 
					wrapper
						.animate(
							{ width: _getSlide(curSlide).width() },
							{ duration: "fast" }
						); 
				}, loadDelay);

				setTimeout(function(){ 
					wrapper
						.animate(
							{ height: _getSlide(curSlide).height() },
							{ duration: "fast" }
						); 
				}, loadDelay);
			
			}
			
*/			
		}
		
		var _getSlideSize = function( $slide )
		{
			var
				images = $("img", $slide),
				numImages = images.length;
			
			$slide
				.data("imagesLoaded", 0);
			
			if( numImages > 0 )
			{
				images
					.one("load", function() {
						$slide
							.data("imagesLoaded", $slide.data("imagesLoaded") + 1);
						if( $slide.data("imagesLoaded") == numImages )
						{
							$slide
								.data("slideWidth", $slide.outerWidth())
								.data("slideHeight", $slide.outerHeight());
							wrapper
								.trigger("slideLoaded", [ $slide ]);
						}						
					})
					.each(function() {
					  if(this.complete) $(this).load();
					});					
			}
			else 
			{
				$slide
					.data("slideWidth", $slide.outerWidth())
					.data("slideHeight", $slide.outerHeight());
				wrapper
					.trigger("slideLoaded", [ $slide ]);
			}	
				
		}
		
		var _addNavControls = function() 
		{
			// prev/pause/next
			controlsNav
				.appendTo(footer);
			nav_prev
				.appendTo(controlsNav);	
			nav_pause
				.appendTo(controlsNav);
			nav_next
				.appendTo(controlsNav);
		}
		
		var _addNavList = function() 
		{
			// clickable button for each slide
			listNav
				.appendTo(footer);
			
			var 
				item,
				title;
				
			$("> ul > li", wrapper)
				.each(function(i) {
					title = $(this).attr("title") != '' ? ' <span class="title">' + $(this).attr("title") + '</span>' : '';
					item = $('<a href="#" class="dot" rel="' + i + '"><span class="index">' + (i+1) + '</span>' + title + '</a>');
					
					item
						.click(function(e) {	
							e.preventDefault();
						
							prevSlide = curSlide;
							curSlide = parseInt($(this).attr("rel"));
							if(prevSlide == curSlide) return;
							_reset();
							_play();
							plugin.settings.onClickDotNav.apply(wrapper, [curSlide, prevSlide, arguments]);
						})
						.appendTo(listNav);
				});
		}

		// reset autoplay
		var _reset = function()
		{
			if(plugin.settings.autoplay && ! paused) 
			{
				clearInterval(interval);
				interval = setInterval(_playNextSlide, plugin.settings.duration);
			}
		}
		
		// go to next slide
		var _playNextSlide = function() 
		{
			if(plugin.settings.navType != "list") reverse = false;
			
			prevSlide = curSlide;
			curSlide == ( numSlides - 1 ) ? curSlide = 0 : curSlide++;
			if( plugin.settings.autoplay && curSlide == 0 && ! plugin.settings.loop) 
			{
				clearInterval(interval);
				return; 
			}
			_play();	
		}
		
		// go to prev slide
		var _playPrevSlide = function() 
		{
			if(plugin.settings.navType != "list") reverse = true;
			
			prevSlide = curSlide;
			curSlide == 0 ? curSlide = ( numSlides - 1 ) : curSlide--;
			_play();
		}
		
		// go to slide
		var _gotoSlide = function( $index )
		{
			_reset();
			if( $index >= 0 && index < numSlides && $index != curSlide ) 
			{
				if( plugin.settings.navType != "list" ) reverse = index < curSlide;
				prevSlide = curSlide;
				curSlide = index;
				_play();
			}
		}
		
		// get slide N
		var _getSlide = function( $index )
		{
			$index += 1; // 1-based indexing
			if( $index > numSlides ) return;
			
			var 
				slide = $("> ul > li:nth-child(" + $index + ") > img", wrapper).length ? $("> ul > li:nth-child(" + $index + ") > img", wrapper) : $("> ul > li:nth-child(" + $index + ")", wrapper);
			
			return slide;
		}
		
		// pause
		var _pause = function() {
			if( ! paused) 
			{
				if(plugin.settings.autoplay) clearInterval(interval);
				paused = true;	
				$(nav_pause)
					.removeClass("pause");
			}
		}
		
		// resume
		var _resume = function() 
		{
			if(paused) 
			{
				_reset();
				paused = false;
				$(nav_pause)
					.addClass("pause");
			}
		}	
		
		// sleep
		var _sleep = function()
		{
			if( plugin.settings.autoplay ) clearInterval(interval);
		}
		
		// wake
		var _wake = function()
		{
			if( ! paused ) _reset();
		}
		
		// go to curSlide
		var _play = function() 
		{
			if(plugin.settings.autosize && plugin.settings.resize) _setSize();
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

			if( plugin.settings.resize ) 
			{
				wrapper
					.animate(
						{ width: slides.eq(curSlide).data("slideWidth"), height: slides.eq(curSlide).data("slideHeight") },
						{ duration: plugin.settings.speed }
					);
			}
			
			// animate slides
			slides
				.each(function(i) { 
					// set caption
					if( i == curSlide && plugin.settings.includeFooter ) 
					{
						title = $(this).attr("title");
						$(".billboard-caption", wrapper)
							.fadeOut(plugin.settings.speed * 0.5, function(){
								if(title) $(this).text(title).fadeIn(plugin.settings.speed * 0.5);
							});
					} 
					// advance slide
					switch( plugin.settings.transition ) {
						case "fade":
							if( i == curSlide ) {
								$(this)
									.animate(
										{ opacity: "show" },
										{ duration: plugin.settings.speed }
									);
							} else 
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
							if( i == curSlide || i == prevSlide ) {
								x_start = ( i == curSlide ) ? 100 * (reverse ? -1 : 1) : 0;
								x_end = ( i == curSlide ) ? 0 : -100 * (reverse ? -1 : 1);
								if(plugin.settings.transition == "right") {
									x_start *= -1;
									x_end *= -1;
								}
								$(this)
									.css("left", x_start + "%");
								$(this)
									.css("z-index", (i == curSlide ? numSlides+100 : 1));
								$(this)
									.animate(
										{ "left": x_end + "%" }, 
										{
											duration: plugin.settings.speed,
											easing: plugin.settings.ease,
											queue: false
										}
									);
								$(this)
									.show();
							} else 
							{
								$(this)
									.hide();
							}					
							break;
						case "up":
						case "down":
							if( i == curSlide || i == prevSlide ) {
								y_start = (i == curSlide) ? 100 * (reverse ? -1 : 1) : 0;
								y_end = (i == curSlide) ? 0 : -100 * (reverse ? -1 : 1);
								if(plugin.settings.transition == "down") {
									y_start *= -1;
									y_end *= -1;
								}
								$(this)
									.css("top", y_start + "%");
								$(this)
									.css("z-index", (i == curSlide ? numSlides+100 : 1));
								$(this)
									.animate(
										{ "top": y_end + "%" }, 
										{
											duration: plugin.settings.speed,
											easing: plugin.settings.ease,
											queue: false
										}
									);
								$(this)
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
					if( i == curSlide ) 
					{
						$("a[rel=" + i + "]", listNav)
							.addClass("active");
					} else 
					{
						$("a[rel=" + i + "]", listNav)
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