(function($){
    var Article = Backbone.Model.extend({
        defaults:{
            title: "No Title Specified",
            date: "4/16/2014",
            content: "One way to shed light onto the situation is to give a simple enumeration of things that ED lacks and EPF provides. Having used ED for several years on a large project, these are things that, in our case, are major issues, but are perhaps surmountable for others. These are also issues that, based on my understanding of how ED is structured, are going to be fairly non-trivial to properly implement."
        },
        
        initialize: function(){
            _.bindAll(this, "getPreview");
        },
        
        getPreview: function(){
            var dots = "";
            if(this.get("content").length > 200) dots="...";
            return this.get("content").substr(0,200)+dots;
        }
    });
    
    var ArticleList = Backbone.Collection.extend({
        model: Article,
        
        localStorage: new Backbone.LocalStorage("article"),
        
        nextID: function(){
            return this.length>0?this.last().id+1:1;
        },
        
        removeAll: function(){
            this.each(function(model){
                model.destroy();
            });
        }
    });
    
    var articles = new ArticleList;
    
    var PreView = Backbone.View.extend({
        tagName: "article",
        
        template: _.template($("#previewTemplate").html()),
        
        initialize: function(){
            _.bindAll(this, "render");
        },
        
        render: function(){
            var model = this.model;
            $(this.el).append(this.template({title:model.get("title"), date:model.get("date"), id:model.id, preview:model.getPreview()}));
            $(this.el).attr("id", "article"+model.get("id"));
            return this;
        }
    });
    
    var FullView = Backbone.View.extend({
        tagName: "article",
        
        template: _.template($("#fullTemplate").html()),

        initialize: function(){
            _.bindAll(this, "render");
        },
        
        render: function(){
            var model = this.model;
            $(this.el).append(this.template({title:model.get("title"), date:model.get("date"), id:model.id, article:model.get("content")}));
            return this;
        }
    });
    
    var AddNew = Backbone.View.extend({
        el: "#addNew",
        
        events: {
            "click #submit": "submit",
            "click #cancel": "cancel"
        },
        
        initialize: function(){
            _.bindAll(this, "submit", "cancel","hide","show");
        },
        
        submit: function(){
            var title = this.$("#editTitle").val();
            var content = this.$("#content").html();
            
            articles.create({title:title, content:content, date: body.getDate(), id: articles.nextID()});
            this.goBack();
        },
        
        cancel: function(){
            this.goBack();
        },
        
        goBack: function(){
            body.doneEdit();
        },
        
        clearContent: function(){
            this.$("#editTitle").val("");
            this.$("#content").html("");
        },
        
        hide: function(){
            this.clearContent();
            $(this.el).hide();
        },
        
        show: function(){
            $(this.el).show();
        }
    });
    
    var ListPage = Backbone.View.extend({
        el: "#articles",
        
        liTemplate: _.template("<li><a href='#article<%= id%>'><%= title%></a></li>"),
        
        initialize: function(){
            this.listenTo(articles, "add", this.addOne);
            articles.fetch();
        },
        
        render: function(){
            var self = this;
            $(this.el).find("article").remove();
            this.$("#sidenav").children().remove();
            this.$("#sidenav").show();
            articles.each(function(article){
                self.addOne(article);
            });
        },
        
        addOne: function(article){
            this.$("#sidenav").append(this.liTemplate({id:article.get("id"), title:article.get("title")}));
            var pre = new PreView({model: article});
            $(this.el).append(pre.render().el);
        },
        
        hide: function(){
            $(this.el).hide();
        },
        
        show: function(){
            $(this.el).show();
        },
        
        goToArticle: function(id){
            var article = articles.get(id);
            var fullView = new FullView({model: article});
            $(this.el).find("article").remove();
            this.$("#sidenav").hide();
            $(this.el).append(fullView.render().el);
        },
    });

    var Body = Backbone.View.extend({
        el: "body",
                
        events: {
            "click createNew": "goEdit"
        },
        
        initialize: function(){
            this.addnew = new AddNew();
            this.listpage = new ListPage();
            
            this.addnew.hide();
            this.listpage.show();
            
            //articles.removeAll();
        },
        
        render: function(){
            this.addnew.hide();
            this.listpage.show();
            this.listpage.render();
        },
        
        doneEdit: function(){
            this.addnew.hide();
            this.listpage.show();
            router.navigate("");
        },
        
        goEdit: function(){
            this.addnew.show();
            this.listpage.hide();
        },
        
        goToArticle: function(id){
            this.listpage.goToArticle(id);
        },
        
        getDate: function(){
            var date = new Date(),
            month = date.getMonth(), day = date.getDate(), year = date.getFullYear();
            month = (month<9?"0":"")+(month+1), day = (date<10?")":"")+day;
            return month+"/"+day+"/"+year;
        }
    });
    
    var body = new Body();

    var Router = Backbone.Router.extend({
        routes: {
            "":"main",
            "article/:id": "goToArticle",
            "createnew": "goEdit"
        },
        main: function(){
            body.render();
        },
        
        goToArticle: function(id){
            body.goToArticle(id);
        },
        
        goEdit: function(){
            body.goEdit();
        }
    });
    
    var router = new Router();
    Backbone.history.start();
    
    this.$("#sidenav").pin({
        containerSelector: "#articles"
    });
})(jQuery)