// embed the module in a jQuery wrapper so the code is properly namespaced
(function($){
	$.flickrModule = (function(self){
		// flickr requires an API key for the tasks we are about to perform so I've set this up as a global object
		api = {
			key: 'd8abcbddede91d8353fa3a0a8d5b020a'
		},
		callbackHook = '', // we can only use one callback for JSONP but we'll want to do different things with it. We can use this var as a switch	
		self.FlickrPhotosSearch = function(opts){
			me = this;
			// add some default options so something is always returned
			var defaults = {
					term: 'cats',
					per_page: 50,
					page: 1,
					hook: ''
			};
			opts = $.extend(defaults, opts);
			me.opts = opts; // set the opts so they can be used outside the scope of this particular closure
			
			// We don't want to assume that a user will always want the default HTML widget, they might want to consume the JSON on its own.
			// By populating this global var, we determine whether the intention is to populate an HTML element or not
			callbackHook = opts.hook;
			
			// get the JSONP from the Flickr API
			$.ajax({
				url: 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key='+api.key+'&tags='+me.opts.term+'&format=json&page='+me.opts.page+'&per_page='+me.opts.per_page+'&callback=jsonFlickrApi',
				dataType: "jsonp"
			});
		},
		jsonFlickrApi = function(response){
			 // jsonFlickrApi is the name of the callback specified by the Flickr API that will capture the JSONP results 
			if(callbackHook.length > 0) {
				// we found an option passed for an HTML hook, so let's use the default widget

				// build a default HTML widget
				var photo = response.photos.photo,
					flickrPics = '<div class="flickrwrapper">'; 
				$.each(photo, function(key, value){
					// this will build a correct Flickr URL from the components provided by the JSON
					// To save time I have appended an 's' at the end to return a small picture. In a production application I would expect this to be a config option
					var sourceUrl = 'http://farm'+photo[key].farm+'.staticflickr.com/'+photo[key].server+'/'+photo[key].id+'_'+photo[key].secret+'_s.jpg';
					
					// create a text string of the desired HTML - perhaps in a production environment more control could be given over the output
					flickrPics = flickrPics + '<div class="flickrpic"><img src="'+sourceUrl+'" alt="flickr picture" width="75" height="75"/></div>';
				}); 
				flickrPics = flickrPics + '</div>'; 
				
				// build a string for the controls - we know how many pages there are and which we are on from the API, no need to work it out ourselves
				// in a production app maybe we would make these optional
				var controls = ''; // this will be used later for pagination
				if(response.photos.page < response.photos.pages) {
					controls = controls + '<a href="#next" id="pg-'+ (response.photos.page+1) +'" class="control ctrl-next">&rarr;</a>';
				}
				if(response.photos.page > 1) {
					controls = controls + '<a href="#prev" id="pg-'+ (response.photos.page - 1) +'" class="control ctrl-prev">&larr;</a>';
				}
				
				var currentpage = response.photos.page; // set this to a single word var with no dot notation so it can be used as a function param below
				
				// the $.ajax retrieval is asynchronous so there will be a little delay. 
				// Let's fade some placeholder text out and then append the results after the animation is done
				// We're also passing in the current page so we know where to paginate to on each click
				$(callbackHook).find('p').fadeOut(750, function(currentpage) {
					
					$(this).parent().find('.inner').html('').append(flickrPics).append(controls);
					$('.control').click(function(){
						
						// check whether the element clicked on has a class containing the string "next" or "prev", and change the page number of the opts object
						if($(this).attr('class').indexOf('next') > 0){
							me.opts.page = response.photos.page + 1;
						} 
						if($(this).attr('class').indexOf('prev') > 0){
							me.opts.page = response.photos.page - 1;
						}
						$(this).parent().html('<p>One moment please...</p>'); // re-append the loading message. In a production app this would probably be an image
						
						// perform the same search again, this time with the updated page number included
				  		self.FlickrPhotosSearch(me.opts);
					});					
				});	
				
			} else {
				// we don't want the widget, we just want the JSON itself
				return response;
			}
		};
		return self;
	})({});
})(jQuery);