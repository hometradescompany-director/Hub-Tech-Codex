// One affine view transform keeps bodies, atoms and bonds aligned below the HUD.
// Dimensions come from the rendered scene and controls, never from event data.
export function fitSceneY(y,{height,hudBottom,halfButtonHeight,gap=12}){
 if(height<=0)return Number(y);
 const top=Math.max(0,hudBottom)+halfButtonHeight+gap;
 const span=Math.max(0,height-top-halfButtonHeight-gap);
 return (top+Number(y)/100*span)/height*100;
}

// Short scenes show one navigation level. Measured columns keep full-size
// body targets apart rather than compressing the entire hierarchy vertically.
export function compactScenePoints(ids,{width,buttonWidth,gap=12}){
 if(!ids.length)return new Map();
 const columns=Math.min(ids.length,Math.max(1,Math.floor((width-2*gap)/(buttonWidth+2*gap))));
 const rows=Math.ceil(ids.length/columns);
 return new Map(ids.map((id,i)=>[id,[(i%columns+.5)/columns*100,(Math.floor(i/columns)+.5)/rows*100]]));
}
