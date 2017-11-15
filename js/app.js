var App = new Vue({
  name: "app",
  el: "#app",
  data: {
    fileName: "",
    fileKey: "",
    result: [],
    uploadedImage: "",
    appId: "1984191275151457",
    roleArn: "arn:aws:iam::580796990244:role/yuzura-mycar-facebook-role",
    bucketName: "yuzura-mycar-test",
    region: "us-east-1",
    fbAuthenticated: true,
    fbUserId: "",
    bucket: null,
    objects: [],
    onS3Uploading: false,
    onRekognitionProcessing: false
  },
  created: function(){
    this.initializeFacebook();
  },
  mounted: function(){
    // テスト用データ
    // let jsondata = '{"Labels":[{"Name":"People","Confidence":98.94397735595703},{"Name":"Person","Confidence":98.94400024414062},{"Name":"Human","Confidence":98.89904022216797},{"Name":"Computer","Confidence":97.84500122070312},{"Name":"Electronics","Confidence":97.84500122070312},{"Name":"LCD Screen","Confidence":97.84500122070312},{"Name":"Laptop","Confidence":97.84500122070312},{"Name":"Pc","Confidence":97.84500122070312},{"Name":"Conference Room","Confidence":92.3609390258789},{"Name":"Indoors","Confidence":92.3609390258789},{"Name":"Meeting Room","Confidence":92.3609390258789},{"Name":"Room","Confidence":92.3609390258789},{"Name":"Classroom","Confidence":92.15576934814453},{"Name":"Hardware","Confidence":82.62897491455078}]}';
    // this.result = JSON.parse(jsondata).Labels;
    this.bucket = new AWS.S3({
      params: {
          Bucket: this.bucketName
      }
    });
  },
  computed: {
    s3UploadButtonActive: function(){
      return this.fbAuthenticated ? "" : "display:none";
    },
    uploadResultActive: function(){
      return this.objects.length > 0 ? "" : "display:none";
    }
  },
  methods: {
    startS3Process: function(){
      this.onS3Uploading = true;
    },
    endS3Process: function(){
      this.onS3Uploading = false;
    },
    startRekognitionProcess: function(){
      this.onRekognitionProcessing = true;
    },
    endRekognitionProcess: function(){
      this.onRekognitionProcessing = false;
    },
    onS3Upload: function(){
      App.startS3Process();
      var fileChooser = document.getElementById('file-chooser');
      var results = document.getElementById('results');

      var file = fileChooser.files[0];
      if (file) {
          results.innerHTML = '';
          App.fileName = file.name;
          App.fileKey = 'facebook-' + App.fbUserId + '/' + file.name;
          var params = {
              Key: App.fileKey,
              ContentType: file.type,
              Body: file,
              ACL: 'public-read'
          };

          App.bucket.putObject(params, function (err, data) {
            if (err) {
                results.innerHTML = 'ERROR: ' + err;
            } else {
                // this.listObjs();
                this.onRekogition();
            }

            App.endS3Process();

          }.bind(this));
      } else {
          results.innerHTML = 'Nothing to upload.';
      }
    },
    // listObjs: function(){
    //   var results = document.getElementById('results');
    //   var prefix = 'facebook-' + this.fbUserId;
    //   this.bucket.listObjects({
    //       Prefix: prefix
    //   }, function (err, data) {
    //       if (err) {
    //           results.innerHTML = 'ERROR: ' + err;
    //       } else {
    //           var objKeys = "";
    //           data.Contents.forEach(function (obj) {
    //               objKeys += obj.Key + "<br>";
    //           });
    //           results.innerHTML = objKeys;
    //           this.objects = data.Contents;
    //       }
    //   }.bind(this));
    // },
    initializeFacebook: function(){
      window.fbAsyncInit = function () {
        FB.init({
            appId: App.appId,
            cookie     : true,
            xfbml      : true,
            version    : 'v2.11'
        });

        FB.login(function (response) {
          App.bucket.config.credentials = new AWS.WebIdentityCredentials({
              ProviderId: 'graph.facebook.com',
              RoleArn: App.roleArn,
              WebIdentityToken: response.authResponse.accessToken
          });
          App.fbUserId = response.authResponse.userID;
          App.fbAuthenticated = true;
        })
      };

       // Load the Facebook SDK asynchronously
      (function (d, s, id) {
          var js, fjs = d.getElementsByTagName(s)[0];
          if (d.getElementById(id)) {
              return;
          }
          js = d.createElement(s);
          js.id = id;
          js.src = "https://connect.facebook.net/en_US/all.js";
          fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    },
    onRekogition: function(e){
      if (App.objects.length < -1){
        return false;
      }

      App.startS3Process();
      var params = {
        Image: {
         S3Object: {
          Bucket: App.bucketName,
          Name: App.fileKey
         }
        },
        MaxLabels: 123,
        MinConfidence: 70
       };

      var cred = App.bucket.config.credentials;
      var rekognition = new AWS.Rekognition({credentials: cred, region: App.region})
      rekognition.detectLabels(params, function(err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
        }
        else {
          console.log(data);           // successful response
          App.result = data.Labels;
        }
      }.bind(this));
    },
    onFileChange: function(e) {
      let files = e.target.files || e.dataTransfer.files;
      this.createImage(files[0]);
    },
    // アップロードした画像を表示
    createImage: function(file) {
      let reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    //音を鳴らすよ
    onSound: function(e) {
      var minConfidence = 50;
      var confidenceJson = {};
      $.ajax({
	       url: "data.json",
	       dataType: 'json',
	       async: false,
	       success: function(json) {
		        confidenceJson = json;
	       }
      });
      this.result.forEach(function(label){
        if (minConfidence <= label.Confidence)
        {
          var matchData = confidenceJson.filter(function(item, index){
            if (item.Name == label.Name) return true;
          });
          if (matchData != null && matchData.length > 0)
          {
            var sound = new Howl({
              src: [matchData[0].File], volume : label.Confidence / 100
            });
            sound.play();
          }
        }
      });
    }
  }
})
