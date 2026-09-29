/* Reference-faithful 2.5D cast. Approved by user: illustrated actors, not 360-degree models. */
window.createDabinRenderer=(gl,host)=>{
 'use strict';const canvas=host||document.querySelector('#planet');
 function compile(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
 const pg=gl.createProgram();
 gl.attachShader(pg,compile(gl.VERTEX_SHADER,`attribute vec2 p;uniform mat4 vp;uniform vec3 center,right,up;uniform vec2 size;uniform vec4 frame;uniform float walking,phase,hero;varying vec2 uv;
 void main(){vec2 q=p;
 if(hero>.5){
 // The approved image has an A-stance. Bring the ankles under the hips at rest.
 // Separate thigh/knee/ankle influences, never deform the face or shirt details.
 float side=p.x<.5?-1.:1.;
 float leg=1.-smoothstep(.405,.455,p.y);
 float belowHip=clamp((.435-p.y)/.42,0.,1.);
 q.x-=side*.087*belowHip*belowHip*leg;
 float a=phase+(side>0.?3.14159265:0.);
 float swing=max(0.,sin(a));
 float support=max(0.,-sin(a));
 float ankle=1.-smoothstep(.05,.255,p.y);
 float knee=1.-smoothstep(.24,.43,p.y);
 float w=walking;
 // Passing foot clears the ground; support foot stays planted. Knees lead the step.
 q.y+=w*leg*(.052*swing*ankle+.018*swing*knee-.007*support*ankle);
 q.x+=w*leg*(side*.006*sin(a)*knee-side*.012*swing*ankle);
 // Mild perspective shortening on the retreating shin, around its knee.
 q.y+=w*leg*.015*support*(.245-p.y)*(1.-smoothstep(.22,.28,p.y));
 float arm=(1.-smoothstep(.30,.355,min(p.x,1.-p.x)))*smoothstep(.32,.365,p.y)*(1.-smoothstep(.62,.70,p.y));
 float forearm=1.-smoothstep(.40,.60,p.y);
 q.y+=arm*w*(-sin(a)*.019+max(0.,-sin(a))*.012*forearm);
 q.x-=side*arm*(.012*forearm+w*.012*max(0.,-sin(a))*forearm);
 // Weight transfer is confined to the upper body; planted feet do not bounce.
 float body=smoothstep(.04,.43,p.y);
 q.y+=w*.006*(1.-cos(phase*2.))*body;
 q.x+=w*.005*sin(phase)*body;
 }

 gl_Position=vp*vec4(center+right*(q.x-.5)*size.x+up*q.y*size.y,1.);uv=frame.xy+p*frame.zw;}`));
 gl.attachShader(pg,compile(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D atlas;varying vec2 uv;void main(){vec4 c=texture2D(atlas,uv);if(c.a<.045)discard;gl_FragColor=c;}`));
 gl.linkProgram(pg);if(!gl.getProgramParameter(pg,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pg));
 const U={};for(const n of ['vp','center','right','up','size','frame','walking','phase','hero','atlas'])U[n]=gl.getUniformLocation(pg,n);const A=gl.getAttribLocation(pg,'p');
 const vertices=[];for(let y=0;y<60;y++)for(let x=0;x<40;x++){const a=x/40,b=y/60,c=(x+1)/40,d=(y+1)/60;vertices.push(a,b,c,b,a,d,a,d,c,b,c,d)}const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 const textures=[];let ready=false;
 Promise.all(['hero-fullbody.webp','npc-original-atlas.webp'].map((name,i)=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures[i]=t;resolve()};im.onerror=()=>reject(Error('参考角色素材未加载'));im.src='assets/cast-v21/'+name}))).then(()=>{ready=true;canvas.dataset.avatar='ready';canvas.dataset.cast='reference-2.5d-v23';window.dispatchEvent(new Event('avatarready'))}).catch(e=>{canvas.dataset.avatar='error';window.dispatchEvent(new CustomEvent('avatarerror',{detail:e.message}))});
 // Row-major indices in the user's supplied cast, retained rather than redesigned.
 const ids=[0,5,7,2,3,15,6,1,4,11,10,9,14],rows=[[38,390],[395,720],[735,1055],[1060,1380]],W=1088,H=1445;
 let walkBlend=0,lastWalkTime=performance.now();
 const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
 return {render({vp,yaw,phase,moving,point,model=0,size=.35,walkAmount=null}){if(!ready)return false;gl.useProgram(pg);gl.uniformMatrix4fv(U.vp,false,new Float32Array(vp));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(A);gl.vertexAttribPointer(A,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U.atlas,0);
 const co=Math.cos(yaw),si=Math.sin(yaw),pos=[co*point[0]+si*point[2],point[1],-si*point[0]+co*point[2]],right=unit([vp[0],vp[4],vp[8]]),cameraUp=unit([vp[1],vp[5],vp[9]]),radial=unit(pos),d=radial.reduce((s,v,i)=>s+v*right[i],0),up=unit(cameraUp.map((v,i)=>v));
 gl.uniform3fv(U.center,pos);gl.uniform3fv(U.right,right);gl.uniform3fv(U.up,up);gl.uniform1f(U.hero,model===0?1:0);if(model===0){const now=performance.now(),dt=Math.min((now-lastWalkTime)/1000,.25);lastWalkTime=now;const reduce=window.cosmicMotion?.reduced||window.cosmicMotion?.paused;const target=reduce?0:(moving?1:0);walkBlend=reduce?0:walkBlend+(target-walkBlend)*(1.-Math.exp(-dt/ .075));if(walkBlend<.001)walkBlend=0;canvas.dataset.walkBlend=walkBlend.toFixed(3);canvas.dataset.gait='alternating-step';}gl.uniform1f(U.walking,model===0?(walkAmount===null?walkBlend:walkAmount):0);gl.uniform1f(U.phase,phase);
 if(model===0){gl.bindTexture(gl.TEXTURE_2D,textures[0]);gl.uniform4fv(U.frame,[.04,.008,.92,.984]);const h=size*3.15;gl.uniform2fv(U.size,[h*(1024*.92)/(1536*.984),h]);}
 else{const index=ids[model-1],row=Math.floor(index/4),col=index%4,[top,bottom]=rows[row];gl.bindTexture(gl.TEXTURE_2D,textures[1]);gl.uniform4fv(U.frame,[(col*272+2)/W,1-bottom/H,268/W,(bottom-top)/H]);const h=size*2.9;gl.uniform2fv(U.size,[h*268/(bottom-top),h]);}
 gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,vertices.length/2);gl.depthMask(true);gl.disable(gl.BLEND);return true;}}
};
