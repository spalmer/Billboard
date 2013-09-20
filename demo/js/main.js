$(document).ready(function() {

	var
		leftBillboard,
		rightBillboard,
		upBillboard,
		downBillboard,
		fadeBillboard,
		gotoBillboard;
		
	leftBillboard = new $.billboard( 
		".billboard.left", 
		{ 
			transition: 	"left"
		});
		
	rightBillboard = new $.billboard(
		".billboard.right", 
		{ 
			transition:		"right", 
			duration:			2000, 
			speed: 				500, 
			nav:					"controls" 
		});
		
	upBillboard = new $.billboard(
		".billboard.up", 
		{ 
			transition:		"up", 
			nav:					"none" 
		});
		
	downBillboard	= new $.billboard(
		".billboard.down", 
		{ 
			ease:					"easeInOutElastic", 
			speed:				2000, 
			transition:		"down" 
		});
		
	fadeBillboard = new $.billboard(
		".billboard.fade", 
		{ 
			transition:		"fade", 
			footer:				false 
		});
		
	gotoBillboard 		= new $.billboard(
		".billboard.goto"
	);

	// controls for last billboard
	$("nav.goto a")
		.click(function(e) {
			e.preventDefault();
			
			gotoBillboard
				.goto( $("nav a").index(this) );
		
		});
		
	// pretty printed code
	$("pre.prettyprint")
		.each(function() {
			$(this)
				.text( $(this).html() );
		});
	
});