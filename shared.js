function openLightbox(src,cap){
  document.getElementById('lightbox-img').src=src;
  document.getElementById('lightbox-cap').textContent=cap;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox(){document.getElementById('lightbox').classList.remove('active')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});

function handleSubmit(e){
  e.preventDefault();
  const f=e.target;
  const get=id=>(f.querySelector('#'+id)||{}).value||'';
  const name=get('name'),email=get('email'),type=get('type'),size=get('size'),details=get('details');
  const body=`Hi Brooke,%0D%0A%0D%0AI'd like to commission a piece.%0D%0A%0D%0AName: ${name}%0D%0AEmail: ${email}%0D%0AType: ${type}%0D%0ASize: ${size}%0D%0A%0D%0ADetails:%0D%0A${details}`;
  window.location.href=`mailto:hipstercookie024@gmail.com?subject=Commission Inquiry from ${name}&body=${body}`;
}

const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting)en.target.classList.add('in')})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
