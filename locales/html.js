module.exports = {
    "activate.html":`
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
        <script src="https://kit.fontawesome.com/2f44437034.js" crossorigin="anonymous"></script>
        <style>
        @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');
        :root{
            --text-color: #707070;
            --primary-color: #fdb03d;
            --bg-color:#0274CD;
        
        }
        * {
            box-sizing: border-box;
        }
        
        body {
            background: #f6f5f7;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-family: 'Montserrat', sans-serif;
            height: 95vh;
            margin: -20px 0 50px;
        }
        
        h1{
        margin-left: 15%;
        margin-top: 3%;
        font-size: 40px;
        }
        
        .container {
            background-color: #fff;
            border-radius: 10px;
              box-shadow: 0 14px 28px rgba(0,0,0,0.25), 
                    0 10px 10px rgba(0,0,0,0.22);
            position: absolute;
            overflow: hidden;
            width: 900px;
            height: 600px;
            max-width: 100%;
            min-height: 480;
            margin-top: 50px;
        }
        
        p{
            font-family: 'Roboto', sans-serif;
             align-items: center;
             margin-top: 3%;
             margin-left: 3%;
             font-size: larger;
             font-weight: 700;
        
        }
        button {
            border-radius: 20px;
            border: 1px solid let(--bg-color);
            background-color: let(--bg-color);
            color: #FFFFFF;
            font-size: 12px;
            font-weight: bold;
            padding: 12px 45px;
            letter-spacing: 1px;
            text-transform: uppercase;
            transition: transform 80ms ease-in;
            margin-left: 21.5%;
            margin-top: 1%;
            font-size: 18px;
            cursor: pointer;
        }
        
        img{
            margin-left: 21%;
            margin-top: 1%;
        }
        #lg{
            margin-left: 17.6%;
        }
        
        .overlay {
            background: let(--primary-color);
            background: linear-gradient(2deg,#ffffff, #ffffff );
            background-repeat: no-repeat;
            background-size: cover;
            background-position: 0 0;
            color: let(--bg-color);
            position: absolute;
            height: 100%;
            width: 200%;
              transform: translateX(0);
            transition: transform 0.6s ease-in-out;
        }
        </style>
    </head>
    
    <body>
        <div class="container" id="container">
            <div class="overlay">
                <h1>Account Activation</h1>
                <img src="https://techcommunity.microsoft.com/t5/image/serverpage/image-id/172206i70472167E79B9D0F?v=v2" alt="" height="150px">
                <p>Activation link has been sent to your registered email id. Use that link to activate your account.
                </p>
                <p id="lg">If already activated, You can now Login</p>
                <button onclick="login()">Login</button>
                <script>
                    function login(){
                        location.href="https://electronicsmartapi.github.io/login.html"
                    }
                </script>
            </div>
    
        </div>
    
    </body>
    
    </html>`
}