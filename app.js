 const express=require('express');
 const app = express();
 const usermodel = require('./models/usermodel');

 const cookieParser = require('cookie-parser');
 const bcrypt = require('bcrypt');
 const postmodel = require('./models/post');
 const jwt = require('jsonwebtoken');

   app.set("view engine","ejs");
   app.use(express.json());
   app.use(express.urlencoded({extended:true}));
   app.use(cookieParser())

  app.get('/', function(req,res){
      res.render('index');
   });


  app.get('/login', function(req,res){
        res.render('login');
  });
 
  app.get('/profile',isloggedin, async (req, res) => {
  
    let user = await usermodel.findOne({ email: req.user.email }).populate('posts');
   
      res.render('profile',{user});

});


app.get('/like/:id',isloggedin, async (req, res) => {
  
  let post = await postmodel.findOne({_id: req.params.id }).populate('user');

  if(post.likes.indexOf(req.user.userid) === -1){
    post.likes.push(req.user.userid)
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
  }
   

  await post.save();

  res.redirect('/profile');

});



app.get('/edit/:id',isloggedin, async (req, res) => {
  
  let post = await postmodel.findOne({_id: req.params.id }).populate('user');

 res.render('edit', {post})

});

app.post('/update/:id',isloggedin, async (req, res) => {
  
  let post = await postmodel.findOneAndUpdate({_id: req.params.id },{content: req.body.content});

 res.redirect('/profile')

});

app.post('/post',isloggedin, async function(req,res){
  
    let user = await usermodel.findOne({email: req.user.email});

    let {content} = req.body;

    let post = await postmodel.create({
        user: user._id,
        content
      });
    
       user.posts.push(post._id);
      await user.save();
   
      res.redirect('/profile');
    });

   app.post('/login', async function(req,res){
            let {email,password}=req.body;

            let user = await usermodel.findOne({email});
           if(!user) return res.status(500).send("somthing went wrong");

            bcrypt.compare(password, user.password,function(err,result){

              if(result){

                let token = jwt.sign({email, userid: user._id}, "abcd");
                res.cookie("token",token);
                 res.status(200).redirect("profile")

              } 
              else res.redirect('/login')

            })
    });


    app.get('/logout', function(req,res){
      res.cookie("token", "");
      res.redirect('/login');
});


   app.post('/register', async function(req,res){
            let {email, name, username, age, password} = req.body;

            let user = await usermodel.findOne({email});
            if(user) return res.status(500).send("user alerday exiset");
            

            bcrypt.genSalt(10, function(err,salt){

              bcrypt.hash(password,salt, async function(err,hash){

                  let user = await usermodel.create({
                      name,
                      username,
                      age,
                      email,
                      password:hash
                    }) 
                    
              let token = jwt.sign({email, userid: user._id}, "abcd");
              res.cookie("token",token);
              res.redirect("/profile")

        })
      })

   });

   function isloggedin(req, res, next){
       
      if(req.cookies.token === "") res.redirect("/login");
      else{
       let data = jwt.verify(req.cookies.token, "abcd");
       req.user =data;
      }
      next();
   }
   app.listen(3000);