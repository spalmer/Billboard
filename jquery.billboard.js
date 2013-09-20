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
			onInit:						function(){}
		};

		var plugin = this;
		plugin.settings = {}

		// variables
		var 
			numSlides 	= $("> ul > li", wrapper).size(),
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
		 
		var init = function() {
		plugin.settings = $.extend({}, defaults, options);
		plugin.el = el;
		
				// single slide
				if(numSlides <= 1) 
				{
					wrapper.addClass("billboard-activated billboard-single");
					setSize();
					return;
				}
				
				buildInterface();
				plugin.settings.onInit.apply(wrapper, arguments);
				
				wrapper
					.addClass("billboard-activated");
				if( plugin.settings.autosize ) {
					wrapper.addClass("billboard-autosize");
				}					
				plugin.ready = true;
				
				// load first slide
				play();
				
			}

		/*************************************
		 * Public methods
		 */
		 
		plugin.play = function() 
		{
			play();
		};		
		plugin.pause = function() 
		{
			pause();
		};		
		plugin.resume = function() 
		{
			resume();
		};
		plugin.goto = function(index) 
		{
			gotoSlide(index);
		};
		plugin.get = function(index)	
		{
			return getSlide(index);
		};
		plugin.sleep = function()
		{
			sleep();
		}	
		plugin.wake = function()
		{
			wake();
		}
	 			
		/*************************************
		 * Private methods
		 */

  	// build interface
			var buildInterface = function() 
			{
				// style nav
				if(plugin.settings.styleNav) 
				{
					$(listNav).addClass("billboard-styled");
					$(controlsNav).addClass("billboard-styled");
				}
				
				setSize();
				
				// init first slide position
				if(plugin.settings.transition == "left")
				{
					$("> ul > li:first", wrapper)
						.css("left", wrapper.width()+"px");
				}
				if(plugin.settings.transition == "right") 
				{
					$("> ul > li:first", wrapper)
						.css("left", -wrapper.width()+"px");
				}
				if(plugin.settings.transition == "up") 
				{
					$("> ul > li:first", wrapper)
						.css("top", -wrapper.height()+"px");
				}
				if(plugin.settings.transition == "down") 
				{
					$("> ul > li:first", wrapper)
						.css("top", wrapper.height()+"px");
				}
					
				// add footer, caption and nav
				if(plugin.settings.includeFooter) {
					footer
						.appendTo(wrapper);
					caption
						.appendTo(footer);
					// build nav
					switch(plugin.settings.navType) {	
						case "controls":
							addNavControls();
							break;
						case "list":
							addNavList();
							break;
						case "both":
							addNavControls();
							addNavList();
							break;
						case "none":
							// none
							break;
					}	
				}
					
				// hide all slides
				$("> ul > li", wrapper)
					.hide();
	
				// button behaviours
				$(nav_pause)
					.click(function(e) 
					{
						e.preventDefault();
						
						if(paused)
						{
							playNextSlide();
							if(plugin.settings.autoplay) interval = setInterval(playNextSlide, plugin.settings.duration);
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
				$(nav_next)
					.click(function(e) 
					{
						e.preventDefault();

						reset();
						playNextSlide();
						plugin.settings.onClickPrev.apply(wrapper, [curSlide, prevSlide, arguments]);
					});
				$(nav_prev)
					.click(function(e) 
					{
						e.preventDefault();

						reset();
						playPrevSlide();
						plugin.settings.onClickNext.apply(wrapper, [curSlide, prevSlide, arguments]);
					});
						
			}
	
			// set width/height to first slide dimensions
			var setSize = function() 
			{
				if( ! firstRun) loadDelay = 0;
				firstRun = false;
				
				if(plugin.settings.autosize) 
				{
					setTimeout(function(){ 
						wrapper
							.animate(
								{ width: getSlide(curSlide).width() },
								{ duration: "fast" }
							); 
					}, loadDelay);

					setTimeout(function(){ 
						wrapper
							.animate(
								{ height: getSlide(curSlide).height() },
								{ duration: "fast" }
							); 
					}, loadDelay);
				
				}
			}
			
			var addNavControls = function() 
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
			
			var addNavList = function() 
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
								reset();
								play();
								plugin.settings.onClickDotNav.apply(wrapper, [curSlide, prevSlide, arguments]);
							})
							.appendTo(listNav);
					});
			}
	
			// reset autoplay
			var reset = function()
			{
				if(plugin.settings.autoplay && ! paused) 
				{
					clearInterval(interval);
					interval = setInterval(playNextSlide, plugin.settings.duration);
				}
			}
			
			// go to next slide
			var playNextSlide = function() 
			{
				if(plugin.settings.navType != "list") reverse = false;
				
				prevSlide = curSlide;
				curSlide == ( numSlides - 1 ) ? curSlide = 0 : curSlide++;
				if( plugin.settings.autoplay && curSlide == 0 && ! plugin.settings.loop) 
				{
					clearInterval(interval);
					return; 
				}
				play();	
			}
			
			// go to prev slide
			var playPrevSlide = function() 
			{
				if(plugin.settings.navType != "list") reverse = true;
				
				prevSlide = curSlide;
				curSlide == 0 ? curSlide = ( numSlides - 1 ) : curSlide--;
				play();
			}
			
			// go to slide
			var gotoSlide = function(index)
			{
				reset();
				if(index >= 0 && index < numSlides && index != curSlide) {
					if(plugin.settings.navType != "list") reverse = index < curSlide;
					prevSlide = curSlide;
					curSlide = index;
					play();
				}
			}
			
			// get slide N
			var getSlide = function(index)
			{
				index += 1; // 1-based indexing
				if(index > numSlides) return;
				
				var 
					slide = $("> ul > li:nth-child(" + index + ") > img", wrapper).length ? $("> ul > li:nth-child(" + index + ") > img", wrapper) : $("> ul > li:nth-child(" + index + ")", wrapper);
				
				return slide;
			}
			
			// pause
			var pause = function() {
				if( ! paused) 
				{
					if(plugin.settings.autoplay) clearInterval(interval);
					paused = true;	
					$(nav_pause)
						.removeClass("pause");
				}
			}
			
			// resume
			var resume = function() 
			{
				if(paused) 
				{
					reset();
					paused = false;
					$(nav_pause)
						.addClass("pause");
				}
			}	
			
			// sleep
			var sleep = function()
			{
				if(plugin.settings.autoplay) clearInterval(interval);
			}
			
			// wake
			var wake = function()
			{
				if( ! paused ) reset();
			}
			
			// go to curSlide
			var play = function() 
			{
				if(plugin.settings.autosize && plugin.settings.resize) setSize();
				// determine animation direction
				if( plugin.settings.navType == "list" ) 
				{
					reverse = ! ( 
						( curSlide > prevSlide ) || 
						( curSlide == 0 && prevSlide == ( numSlides - 1 ) ) || 
						( curSlide == prevSlide && curSlide == 0 ) 
					);
				}
				plugin.settings.onSlideChange.apply(wrapper, [curSlide, prevSlide, reverse, arguments]);				
				$( "> ul > li", wrapper )
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
									x_start = ( i == curSlide ) ? wrapper.width() * (reverse ? -1 : 1) : 0;
									x_end = ( i == curSlide ) ? 0 : -wrapper.width() * (reverse ? -1 : 1);
									if(plugin.settings.transition == "right") {
										x_start *= -1;
										x_end *= -1;
									}
									$(this)
										.css("left", x_start+"px");
									$(this)
										.css("z-index", (i == curSlide ? numSlides+100 : 1));
									$(this)
										.animate(
											{ "left": x_end + "px" }, 
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
									y_start = (i == curSlide) ? wrapper.height() * (reverse ? -1 : 1) : 0;
									y_end = (i == curSlide) ? 0 : -wrapper.height() * (reverse ? -1 : 1);
									if(plugin.settings.transition == "down") {
										y_start *= -1;
										y_end *= -1;
									}
									$(this)
										.css("top", y_start+"px");
									$(this)
										.css("z-index", (i == curSlide ? numSlides+100 : 1));
									$(this)
										.animate(
											{ "top": y_end + "px" }, 
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
				reset();
			}		
		
  	// constructor	
  	init();
		
	}
  
})( jQuery );