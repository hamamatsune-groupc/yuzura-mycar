var App = new Vue({
  name: "app",
  el: "#app",
  data: {
    message: "Hey!",
    message: 'Hello Vue!',
    fileName: "",
    fileUrl: "",
    awsAccessKey: "",
    awsAccessSecret: "",
    s3Bucket: "yuzura-mycar",
    s3Region: "ap-northeast-1",
    result: [],
    uploadedImage: ""
  },
  mounted: function(){
    // テスト用データ
    let jsondata = '{"Labels":[{"Name":"People","Confidence":98.94397735595703},{"Name":"Person","Confidence":98.94400024414062},{"Name":"Human","Confidence":98.89904022216797},{"Name":"Computer","Confidence":97.84500122070312},{"Name":"Electronics","Confidence":97.84500122070312},{"Name":"LCD Screen","Confidence":97.84500122070312},{"Name":"Laptop","Confidence":97.84500122070312},{"Name":"Pc","Confidence":97.84500122070312},{"Name":"Conference Room","Confidence":92.3609390258789},{"Name":"Indoors","Confidence":92.3609390258789},{"Name":"Meeting Room","Confidence":92.3609390258789},{"Name":"Room","Confidence":92.3609390258789},{"Name":"Classroom","Confidence":92.15576934814453},{"Name":"Hardware","Confidence":82.62897491455078}]}';
    this.result = JSON.parse(jsondata).Labels;
  },
  methods: {
    onRekogition: function(){
      AWS.config.accessKeyId = this.awsAccessKey;
      AWS.config.secretAccessKey = this.awsAccessSecret;
      AWS.config.region = "us-east-1";
      var params = {
        Image: {
         S3Object: {
          Bucket: "yuzura-mycar-us-east-1",
          Name: "IMG_3266.jpg"
         }
        },
        MaxLabels: 123,
        MinConfidence: 70
       };
      var rekognition = new AWS.Rekognition();
      rekognition.detectLabels(params, function(err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
        }
        else {
          console.log(data);           // successful response
          this.result = data.Labels;
        }
      }.bind(this));
    },
    onSendS3: function(){
      // this.onUploadToS3();
      var file = window.file.files[0];
      this.onUploadToS3(file);
    },
    onUploadToS3: function(file){
      if(file){
        var params = {
          Key: file.name,
          ContentType: file.type,
          ACL: "public-read",
          Body: file
        };

        AWS.config.accessKeyId = this.awsAccessKey;
        AWS.config.secretAccessKey = this.awsAccessSecret;
        AWS.config.region = this.s3Region;
        var bucket = new AWS.S3({
          params:{
            Bucket : this.s3Bucket
          }
        });

        bucket.putObject(params, function(err, data){
          App.fileName = file.name;
          document.getElementById("button_modal").click();
        });
      }
      else{
        // error
      }
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
      this.result.forEach(function(label){
        if (minConfidence <= label.Confidence)
        {
          if (label.Name == "Person")
          {
            var sound = new Howl({
              src: ['mp3/walk-asphalt2.mp3'], volume : label.Confidence / 100
            });
            sound.play();
          }
        }
      });
    }
  }
})
