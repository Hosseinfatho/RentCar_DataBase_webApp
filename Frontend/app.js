function pingAPI(){
  fetch("http://127.0.0.1:5000/")
  .then(res=>res.text())
  .then(data=>document.getElementById("result").innertext=data)
  .catch(err=>document.getElementById("result").innerHTML="Error: "+err)
}

