(function($){
    var dragElement = null;

    var linkModel = Backbone.Model.extend({
        defaults: {
            title: "Sina",
            isLink: true,
            siteURL: "http://www.sina.com.cn",
            image: "images/sina.png",
            slide: "1",
            tooltip: "Double click to open",
            top: false
        },
        
        initialize: function(){
            this.on("invalid", function(model, error){
                alert(model.get("title")+":   "+error);
                this.destroy();
            });
        },
        
        validate: function(attrs, options){
            if(attrs.isLink && attrs.siteURL.substr(0,7) != "http:\/\/"){
                return "The url must start with \"http://\"";
            }
        },
        
        remove: function(){
            this.destroy();
        }
    });
    
    var LinkList = Backbone.Collection.extend({
        model: linkModel,
        
        url: "/linklist",
        
        localStorage: new Backbone.LocalStorage("icon"),
        
        initialize: function(){
            _.bindAll(this, "forSlide");
            console.log("collection url: "+ this.url);
        },
        
        forSlide: function(index,top){
            return this.where({slide: index, top:top});
        },
        
        destroyAll: function(){
            this.each(function(model){
                model.remove();
            });
        },
        
        comparator: "slide"
    });
    
    var linklist = new LinkList();
    
    var addOn = Backbone.View.extend({
        tagName: "div",
        
        addBtnTemplate: _.template($("#addBtnTemplate").html()),
        
        events: {
            "click #cancel" : "close",
            "click #submit" : "submit"
        },
        
        initialize: function(){
            _.bindAll(this, "render", "close", "submit");
            
        },
        
        render: function(){
            $(this.el).append(this.addBtnTemplate());
            this.$("input").css({width:"50%", "background-color":"white"});
            $(this.el).addClass("addLink");
            return this;
        },
        
        close: function(){
             $(this.el).remove();
        },
        
        submit: function(){
            var title = this.$("#title").val();
            var isLink = this.$("#isLink").prop("checked");
            var siteURL = this.$("#siteURL").val();
            var image = this.$("#image").val();
            var slide = this.$("#slide").val();
            var tooltip = this.$("#tooltip").val();
            var top = this.$("#top").prop("checked");
            
            linklist.create({title:title, isLink:isLink, siteURL: siteURL, image: image,slide:slide,tooltip:tooltip, top:top});
            this.close();
        }
    });
    
    var Popup = Backbone.View.extend({
        tagName: "div",
        
        popTemplate: _.template($("#popTemplate").html()),
        
        events: {
            "dblclick header" : "resize",
            "click .close": "close"
        },
        
        initialize: function(){
            _.bindAll(this, "resize","close");
        
            this.max = false;
        },
        
        render: function(){
            $(this.el).append(this.popTemplate());
            $(this.el).children().draggable();
            $(this.el).children().resizable();
            $(this.el).css({width:"100%", height:"100%"});
            return this;
        },
        
        close: function(){
            $(this.el).remove();
        },
        
        resize: function(){
            if(!this.max){
                this.max = true;
                this.height = $(this.el).children().height();
                this.width = $(this.el).children().width();
                this.left = $(this.el).children().position().left;
                this.top = $(this.el).children().position().top;
                $(this.el).children().draggable({disabled: true});
                $(this.el).children().resizable({disabled: true});
                $(this.el).children().css('opacity', '1');
                console.log(this.height+"   "+this.width+"   "+this.left+"    "+this.top);
                $(this.el).children().css({height: "100%", width: "100%", left: 0, top: 0});
            }else{
                this.max = false;
                $(this.el).children().draggable({disabled: false});
                $(this.el).children().resizable({disabled: false});
                $(this.el).children().css({height: this.height, width: this.width, left: this.left, top: this.top});
            }
        }
    });
    
    var Icon = Backbone.View.extend({
        tagName: "li",
        
        template: _.template($("#iconTemplate").html()),
        
        events: {
            "click .title" : "changeTitle",
            "keypress .change" : "doneChangebyKey",
            "blur .change" : "doneChange",
            "dblclick .title" : "goToURL",
            "dblclick img" : "goToURL",
            "mousedown img" :"increaseIndex",
            "mouseup img" : "decreaseIndex"
        },
        
        initialize: function(){
            _.bindAll(this,"render","changeTitle","doneChange", "goToURL", "increaseIndex", "decreaseIndex");
            
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);
            this.max = false;
        },
        
        render: function(top, left){
            var title = this.model.get("tooltip");
            $(this.el).html(this.template(this.model.toJSON()));
            this.$(".change").hide();
            if(!this.model.get("top")) $(this.el).draggable();
            $(this.el).addClass("icon");
            $(this.el).css({left:left, top:top});
            $(this.el).attr({"id":"dragIcon","data-toggle":"tooltip"});
            $(this.el).tooltip({
                animation: true,
                placement: "right",
                title: title,
                trigger: "hover"
            });
            return this;
        },
        changeTitle: function(){
            this.$(".title").hide();
            this.$(".change").show();
            this.$(".change").focus();
            this.$(".change").val(this.model.get("title"));
        },
        
        doneChangebyKey: function(e){
            if(e.keyCode == 13) this.doneChange();
        },
        
        doneChange: function(){
            this.model.save({title: this.$(".change").val()}); //this will give a change signal, so that it will render automaticly.
            this.$(".change").hide();
            this.$(".title").show();
        },
        
        goToURL: function(){
            if(this.model.get("isLink")) window.open(this.model.get("siteURL"));
            else{
                var pop = new Popup();
                $(pop.render().el).appendTo(".carousel-inner");
            }
        },
        
        increaseIndex: function(){
            $(this.el).css({"z-index" : 3});
            $(this.el).tooltip("hide");
        },
        
        decreaseIndex: function(){
            $(this.el).css({"z-index" : 1});
            $(this.el).tooltip("show");
        }
    });
    
    
    
    var TopBar = Backbone.View.extend({
        el: ".slideTop",
        
        initialize: function(){
            _.bindAll(this, "render", "addOne");
        
            this.left = 0;
            this.leftAdd= 70;
            this.top = 0;
            this.topAdd =70;
            this.listenTo(linklist, "add", this.addOne);
            this.render();
        },
        
        render: function(){
            var list = linklist.forSlide("1", true);
            var self=  this;
            list.forEach(function(icon){
                self.addOne(icon);
            });
            
        },
        
        addOne: function(icon){
            if(!icon.get("top")) return;
            $(this.el).append((new Icon({model: icon})).render(this.top,this.left).el);
            this.left += this.leftAdd;
            if(this.top+this.topAdd > $(window).height()*0.7){
                this.left = 0;
                this.top += this.topAdd;
            }
        }
    });
    
    var slide1 = Backbone.View.extend({
        el: "#slide1",
        
        events: {
            "dblclick .addBox" : "add"
        },
        
        addtemplate: _.template($("#addTemplate").html()),
        
        initialize: function(){
            _.bindAll(this, "render", "addOne","add");
            
            this.listenTo(linklist, "add", this.addOne);
            
            this.top = 0;
            this.left = 60;
            this.leftAdd = 70;
            this.topAdd = 90;
            this.render();
        },
        
        render: function(){
            var list = linklist.forSlide("1", false);
            var self=  this;
            list.forEach(function(icon){
                self.addOne(icon);
            });
            
            $(this.el).append(this.addtemplate({top:this.top+"px", left:this.left+"px"}));
            this.top += this.topAdd;
            if(this.top+this.topAdd > $(window).height()){
                this.top = 0;
                this.left += this.leftAdd;
            }
        },
        
        addOne: function(icon){
            if(icon.get("top")) return;
            $(this.el).append((new Icon({model: icon})).render(this.top,this.left).el);
            this.top += this.topAdd;
            if(this.top+this.topAdd > $(window).height()){
                this.top = 0;
                this.left += this.leftAdd;
            }
        },
        
        add: function(){
            var add = new addOn();
            $(this.el).append(add.render().el);
        }
    });
    
    var Body = Backbone.View.extend({
        el: ".carousel-inner",
        
        initialize: function(){       
            linklist.fetch();
        
            var top = new TopBar(); 
            var one = new slide1();
            //linklist.destroyAll();
        }
    });
    
    var Router = Backbone.Router.extend({
        routes: {
            "page/:page" : "goToPage",
            "next/:optional" : "nextPage",
            "pre/:optional" : "prePage"
        },
         
        initialize: function(){
            _.bindAll(this, "goToPage", "nextPage");
            
            this.page = 1;
        },
            
        goToPage: function(page){
            this.page = page;
            $(".carousel").carousel(page-1);
        },
        
        nextPage: function(){
            $("a.right").trigger("click");
        },
        
        prePage: function(){
            $("a.left").trigger("click");
        }
    });
    
    var body = new Body();
    $(".carousel").carousel({interval:false});
    var router = new Router();
    Backbone.history.start();
})(jQuery);