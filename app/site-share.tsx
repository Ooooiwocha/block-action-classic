const siteURL='https://block-action-revival.ooooiwocha.chatgpt.site/';
const text='Block Action — Classic Version\nPlay and create stages.\n'+siteURL;
const services=[
 {name:'X',icon:'x',href:'https://x.com/intent/tweet?'+new URLSearchParams({text})},
 {name:'Bluesky',icon:'bluesky',href:'https://bsky.app/intent/compose?'+new URLSearchParams({text})},
 {name:'Threads',icon:'threads',href:'https://www.threads.net/intent/post?'+new URLSearchParams({text})},
 {name:'Facebook',icon:'facebook',href:'https://www.facebook.com/sharer/sharer.php?'+new URLSearchParams({u:siteURL})},
];
export default function SiteShare(){return <nav className="site-share" aria-label="Share this site"><span>SHARE</span>{services.map(s=><a key={s.name} className={'site-share-'+s.icon} href={s.href} target="_blank" rel="noopener noreferrer" title={'Share on '+s.name} aria-label={'Share this site on '+s.name}><img src={'/share-icons/'+s.icon+'.svg'} alt="" width="20" height="20" draggable={false}/></a>)}</nav>;}
