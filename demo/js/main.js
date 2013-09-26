jQuery(document).ready(function($) {
	

	// default	
	$("#billboard1")
		.billboard();
			
	// transition to right with controls		
	$("#billboard2")
		.billboard({ 
			transition:		"right", 
			duration:			2000, 
			speed: 				500, 
			//navType:			"controls",
			autosize: 		false	
		});
	
	// transition up with no navigation	
	$("#billboard3")
		.billboard({ 
			transition:		"up", 
			navType:			"none",
			stretch:			false 
		});
	
	// transition down with custom easing	
	$("#billboard4")
		.billboard({ 
			easing:				"easeInOutElastic", 
			speed:				2000, 
			transition:		"down"
		});

	// fade transition with no footer and resize to each slide's content
	$("#billboard5")
		.billboard({ 
			transition:		"fade", 
			includeFooter: false,
			resize:				 true 
		});
	
	// callback for slide change
	$("#billboard6")
		.billboard({
			onSlideChange: slideChangeHandler
		});
		
	function slideChangeHandler( curSlide, prevSlide, reverse, args )
	{
		var 
			slide = this.billboard().get(curSlide);

		// do something
	}		

	// controls for last billboard
	$("nav.goto a")
		.click(function(e) {
			e.preventDefault();
			
			$("#billboard6")
				.billboard("goto", [ $("nav.goto a").index(this) ]);
		
		});
		
	// pretty printed code
	$("pre.prettyprint")
		.each(function() {
			$(this)
				.text( $(this).html() );
		});
	
});