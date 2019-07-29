function Renderer(canvas)
{
    this.directionLight = true;
    this.pointLight = false;
    this.enableCCWCull = true;
    this.enableCWCull = false;
    this.enableDepthTest = true;
    this.enableWireFrame = false;
    this.canvas = canvas;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.canvasContext = this.canvas.getContext("2d");
    this.depthBuffer = new Array(this.canvasWidth * this.canvasHeight);
}

Renderer.prototype.clearColorAndDepth = function()
{
    this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.backBuffer = this.canvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    this.depthBuffer.fill(10000, 0, this.canvasWidth * this.canvasHeight);
}

Renderer.prototype.setRenderTarget = function(texture){
    this.backBuffer = texture.internalBuffer;
}

Renderer.prototype.resetRenderTarget = function()
{
    this.backBuffer = this.canvasContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
}

Renderer.prototype.render = function (model, worldMatrix, viewMatrix, projectionMatrix, texture, light) {
    if (this.directionLight) {
        this.renderDirectionLightShader(model, worldMatrix, viewMatrix, projectionMatrix, texture, light);
    } else {
        this.renderPointLightShader(model, worldMatrix, viewMatrix, projectionMatrix, texture, light);
    }
};

// 方向光着色接口
Renderer.prototype.renderDirectionLightShader = function (model, worldMatrix, viewMatrix, projectionMatrix, texture, light) {
    let vertexs = [];

    model.meshes.forEach(mesh => {
        mesh.Faces.forEach(face => {

            let v1 = this.DirectionLightShader_VS(mesh.Vertices[face.A], worldMatrix, viewMatrix, projectionMatrix);
            let v2 = this.DirectionLightShader_VS(mesh.Vertices[face.B], worldMatrix, viewMatrix, projectionMatrix);
            let v3 = this.DirectionLightShader_VS(mesh.Vertices[face.C], worldMatrix, viewMatrix, projectionMatrix);

            vertexs.push(v1);
            vertexs.push(v2);
            vertexs.push(v3);
        });
    });

    for (let i = 0; i < vertexs.length / 3; ++i) {

        let v1 = vertexs[i * 3];
        let v2 = vertexs[i * 3 + 1];
        let v3 = vertexs[i * 3 + 2];

        if (this.enableWireFrame) {
            this.WireFrameRaster(v1, v2, v3);
        } else {
            let res = this.SolidRaster(v1, v2, v3);
            res.forEach(v => {
                let color = this.DirectionLightShader_PS(v, texture, light);
                this.drawPoint(v.position, color);
            });
        }
    }

};

// 点光源着色接口
Renderer.prototype.renderPointLightShader = function (model, worldMatrix, viewMatrix, projectionMatrix, texture, light) {
    let vertexs = [];

    model.meshes.forEach(mesh => {
        mesh.Faces.forEach(face => {

            let v1 = PointLightShader_VS(mesh.Vertices[face.A], worldMatrix, viewMatrix, projectionMatrix);
            let v2 = PointLightShader_VS(mesh.Vertices[face.B], worldMatrix, viewMatrix, projectionMatrix);
            let v3 = PointLightShader_VS(mesh.Vertices[face.C], worldMatrix, viewMatrix, projectionMatrix);

            vertexs.push(v1);
            vertexs.push(v2);
            vertexs.push(v3);
        });
    });

    for (let i = 0; i < vertexs.length / 3; ++i) {

        let v1 = vertexs[i * 3];
        let v2 = vertexs[i * 3 + 1];
        let v3 = vertexs[i * 3 + 2];

        if (this.enableWireFrame) {
           WireFrameRaster(v1, v2, v3);
        } else {
            let res = SolidRaster(v1, v2, v3);
            res.forEach(v => {
                let color = PointLightShader_PS(v, texture, light);
                this.drawPoint(v.position, color);
            });
        }
    }
};

// 方向光顶点着色
Renderer.prototype.DirectionLightShader_VS = function (vsInput, worldMatrix, viewMatrix, projectionMatrix) {

    let transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);

    let position2D = Vector3.TransformCoordinates(vsInput.position, transformMatrix);

    let normal = Vector3.TransformNormal(vsInput.normal, worldMatrix);

    return ({
        position: position2D,
        onePerZ : 1,    // onePerZ用于保存1/z，1/z用在透视纹理投影插值上，因为透视投影插值与z不成线性关系，与1/z成线性关系
        normal: normal,
        texcoord: vsInput.texcoord
    });
};

// 方向光像素着色
Renderer.prototype.DirectionLightShader_PS = function (psInput, texture, light) {

    let normal = psInput.normal;
    let lightf = light.directionLight.direction.negate();

    normal.normalize();
    lightf.normalize();

    let nd = Math.min(Math.max(0, Vector3.Dot(normal, lightf)), 1);

    let textureColor;

    if (texture) {
        textureColor = texture.TextureMap(psInput.texcoord.x, psInput.texcoord.y);
    } else {
        textureColor = new Color4(1, 1, 1, 1);
    }

    let ambient = 0.1;

    textureColor = textureColor.multiply(nd + ambient);

    return textureColor;
};

// 点光顶点着色
Renderer.prototype.PointLightShader_VS = function (vsInput, worldMatrix, viewMatrix, projectionMatrix) {

    let transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectionMatrix);

    let position2D = Vector3.TransformCoordinates(vsInput.position, transformMatrix);

    let worldPos = Vector3.TransformCoordinates(vsInput.position, worldMatrix);
    let normal = Vector3.TransformNormal(vsInput.normal, worldMatrix);

    return ({
        worldPosition: worldPos,
        position: position2D,
        normal: normal,
        texcoord: vsInput.texcoord
    });
};

// 点光像素着色
Renderer.prototype.PointLightShader_PS = function (psInput, texture, light) {

    let normal = psInput.normal;
    let lightp = light.pointLight.position;

    let lightd = lightp.subtract(psInput.worldPosition);

    normal.normalize();
    lightd.normalize();

    let nd = Math.max(0, Vector3.Dot(normal, lightd));

    let textureColor;

    if (texture) {
        textureColor = texture.TextureMap(psInput.texcoord.x, psInput.texcoord.y);
    } else {
        textureColor = new Color4(1, 1, 1, 1);
    }

    let ambient = 0.1;

    textureColor = textureColor.multiply(nd + ambient);

    return textureColor;
};

// 实体光栅化
Renderer.prototype.SolidRaster = function (v1, v2, v3) {
    // CVV裁剪
    if(this.CVVClip(v1) || this.CVVClip(v2) || this.CVVClip(v3)) return[];

    this.TransToScreenPos(v1);
    this.TransToScreenPos(v2);
    this.TransToScreenPos(v3);

    if(this.enableCCWCull && this.ccwJudge(v1 , v2 , v3)){
        return [];
    }

    if(this.enableCWCull && !this.ccwJudge(v1 , v2 , v3)){
        return [];
    }

    return this.RasterTriangle(v1, v2, v3);
};

// 线框光栅化
Renderer.prototype.WireFrameRaster = function (v1, v2, v3) {

    this.TransToScreenPos(v1);
    this.TransToScreenPos(v2);
    this.TransToScreenPos(v3);

    this.drawLine(v1 , v2);
    this.drawLine(v2 , v3);
    this.drawLine(v3 , v1);
};

Renderer.prototype.drawLine = function (v0, v1) {
    let x0 = v0.position.x >> 0;
    let y0 = v0.position.y >> 0;
    let x1 = v1.position.x >> 0;
    let y1 = v1.position.y >> 0;
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        this.drawPoint(new Vector2(x0, y0, 1.0), new Color4(1 , 1 , 1, 1));
        if ((x0 === x1) && (y0 === y1)) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
};

// 光栅化三角形
Renderer.prototype.RasterTriangle = function (v1, v2, v3) {
    let pixels = [];
    // 判断三角形类型
    if(v1.position.y == v2.position.y)
    {
        // 平顶
        if(v1.position.y > v3.position.y)
        {
            DrawTriangleTop(v1, v2, v3, pixels);
        }
        else{
            // 平底
            DrawTriangleBottom(v3, v1, v2, pixels);
        }
    }
    else if(v1.position.y == v3.position.y)
    {
        // 平顶
        if(v1.position.y > v2.position.y)
        {
            DrawTriangleTop(v1, v3, v2, pixels);
        }
        else{
            // 平底
            DrawTriangleBottom(v2, v1, v3, pixels);
        }
    }
    else if(v2.position.y == v3.position.y)
    {
        // 平顶
        if(v2.position.y > v1.position.y)
        {
            DrawTriangleTop(v2, v3, v1, pixels);
        }
        else
        {
            // 平底
            DrawTriangleBottom(v1, v2, v3, pixels);
        }
    }
    else{
        // 需分割三角形
        let top = {};
        let mid = {};
        let bottom = {};

        if(v1.position.y > v2.position.y && v2.position.y > v3.position.y)
        {
            top = v3;
            mid = v2;
            bottom = v1;
        }
        else if(v1.position.y > v3.position.y && v3.position.y > v2.position.y)
        {
            top = v2;
            mid = v3;
            bottom = v1;
        }
        else if(v2.position.y > v3.position.y && v3.position.y > v1.position.y)
        {
            top = v1;
            mid = v3;
            bottom = v2;
        }
        else if(v2.position.y > v1.position.y && v1.position.y > v3.position.y)
        {
            top = v3;
            mid = v1;
            bottom = v2;
        }
        else if(v3.position.y > v1.position.y && v1.position.y > v2.position.y)
        {
            top = v2;
            mid = v1;
            bottom = v3;
        }
        else if(v3.position.y > v2.position.y && v2.position.y > v1.position.y)
        {
            top = v1;
            mid = v2;
            bottom = v3;
        }

        let newMid = {};

        // 插值出顶点数据
        let t = (mid.position.y - top.position.y) / (bottom.position.y - top.position.y);
        newMid = this.LerpVertext(top, bottom, t);

        // 使用相似三角形的性质(A1边/B1边=A2/B2边),找出中点x坐标(屏幕坐标)
        let midX = (mid.position.y - top.position.y) / (bottom.position.y - top.position.y) * (bottom.position.x - top.position.x) + top.position.x;
        newMid.position.x = midX;   // 单独重置下x，因为上面插值出来的x肯定是不正确的
        newMid.position.y = mid.position.y;

        // 得出插值后该三角形所有光栅化的像素点
        // 平底三角形
        this.DrawTriangleBottom(top, newMid, mid, pixels);
        // 平顶三角形
        this.DrawTriangleTop(newMid, mid, bottom, pixels);
    }   

    return pixels;
}

function dump_obj(myObject) {  
    var s = "";  
    for (var property in myObject) {  
     s = s + "\n "+property +": " + myObject[property] ;  
    }  
    alert(s);  
  }  

// 过渡插值函数
Renderer.prototype.Lerp = function(a, b, t)
{
    if (a > b){
        return a - (a - b) * this.clamp(t);
    }
    return a + (b - a) * this.clamp(t);
}

// 限制数值范围在0和1之间
Renderer.prototype.clamp = function (value, min, max) {
    if (typeof min === "undefined") {
        min = 0;
    }
    if (typeof max === "undefined") {
        max = 1;
    }
    return Math.max(min, Math.min(value, max));
};

// 过渡插值顶点数据
Renderer.prototype.LerpVertext = function(v1, v2, t)
{
    let res = {};
    if(v1.position){
        res.position = this.LerpVector3(v1.position , v2.position , t);
    }
    if(v1.normal){
        res.normal = this.LerpVector3(v1.normal , v2.normal , t);
    }
    if(v1.texcoord){
        res.texcoord = this.LerpVector2(v1.texcoord , v2.texcoord , t);
    }
    if(v1.worldPosition){
        res.worldPosition = this.LerpVector3(v1.worldPosition, v2.worldPosition, t);
    }
    if (v1.lightViewPosition){
        res.lightViewPosition = this.LerpVector3(v1.lightViewPosition , v2.lightViewPosition , t);
    }

    return res;
}

// 插值vector3
Renderer.prototype.LerpVector3 = function(v1 , v2 , gradient){
    let vx = this.Lerp(v1.x , v2.x , gradient);
    let vy = this.Lerp(v1.y , v2.y , gradient);
    let vz = this.Lerp(v1.z , v2.z , gradient);
    return new Vector3(vx , vy , vz);
};

Renderer.prototype.LerpVector2 = function(v1 , v2 , gradient){
    let vx = this.Lerp(v1.x , v2.x , gradient);
    let vy = this.Lerp(v1.y , v2.y , gradient);
    return new Vector2(vx , vy);
};

// 光栅化平底三角形:v1为上顶点
Renderer.prototype.DrawTriangleBottom = function(p1, p2, p3, pixels)
{
    for (let y = p1.position.y; y <= p2.position.y; y++)
    {
        if(y > 0 && y < this.canvasHeight)
        {
            // 这里xl和xr不一定就在左边和右边，因为没有判定xl和xr的大小，下面代码会判定
            let xl = (y - p1.position.y) * (p2.position.x - p1.position.x) / (p2.position.y - p1.position.y) + p1.position.x;
            let xr = (y - p1.position.y) * (p3.position.x - p1.position.x) / (p3.position.y - p1.position.y) + p1.position.x;
 
            let dy = y - p1.position.y;
            let t = dy / (p3.position.y - p1.position.y);

            // 生成当前y值对应的左右x值
            let lX = {};
            let rX = {};

            lX = this.LerpVertext(p1, p2, t);
            rX = this.LerpVertext(p1, p3, t);            

            lX.position.x = xl;
            lX.position.y = y;

            rX.position.x = xr;
            rX.position.y = y;

            if(xl < xr)
            {
                this.ScanlineProcess(lX, rX, pixels);
            }
            else{
                this.ScanlineProcess(rX, lX, pixels);
            }
        }
    }
}

// 光栅化平顶三角形:v3为下顶点
Renderer.prototype.DrawTriangleTop = function(p1, p2, p3, pixels)
{
    for (let y = p1.position.y; y <= p3.position.y; y++)
    {
        if(y > 0 && y < this.canvasHeight)
        {
            let xl = (y - p1.position.y) * (p3.position.x - p1.position.x) / (p3.position.y - p1.position.y) + p1.position.x;
            let xr = (y - p2.position.y) * (p3.position.x - p2.position.x) / (p3.position.y - p2.position.y) + p2.position.x;
 
            let dy = y - p1.position.y;
            let t = dy / (p3.position.y - p1.position.y);

            // 生成当前y值对应的左右x值
            let lX = {};
            let rX = {};

            lX = this.LerpVertext(p1, p3, t);
            rX = this.LerpVertext(p2, p3, t);
            
            lX.position.x = xl;
            lX.position.y = y;

            rX.position.x = xr;
            rX.position.y = y;

            if(xl < xr)
            {
                this.ScanlineProcess(lX, rX, pixels);
            }
            else{
                this.ScanlineProcess(rX, lX, pixels);
            }
        }
    }
}

// 光栅化一排扫描线
Renderer.prototype.ScanlineProcess = function(lVertext, rVertext, pixels)
{
    for(let x = lVertext.position.x; x < rVertext.position.x; ++x)
    {
        if(x > 0 && x <= this.canvasWidth)
        {
            let gradient = (x - lVertext.position.x) / (rVertext.position.x - lVertext.position.x);
            let v = this.LerpVertext(lVertext, rVertext, gradient);
            pixels.push(v);
        }
    }
}

Renderer.prototype.drawPoint = function (point, color) {
    if (point.x >= 0 && point.y >= 0 && point.x < this.canvasWidth && point.y < this.canvasHeight) {
        let x = point.x;
        let y = point.y;
        let z = point.z;

        this.backbufferdata = this.backBuffer.data;
        let index = ((x >> 0) + (y >> 0) * this.canvasWidth) * 4;

        // 深度测试
        if (this.enableDepthTest && this.depthBuffer[index / 4] < z) {
            return;
        }

        this.depthBuffer[index / 4] = z;

        this.backbufferdata[index] = color.r * 255;
        this.backbufferdata[index + 1] = color.g * 255;
        this.backbufferdata[index + 2] = color.b * 255;
        this.backbufferdata[index + 3] = color.a * 255;
    }
};

Renderer.prototype.present = function () {
    this.canvasContext.putImageData(this.backBuffer, 0, 0);
};

Renderer.prototype.TransToScreenPos = function(vertex)
{    
    vertex.onePerZ = 1 / vertex.position.w;
    // 先执行透视除法，由CVV->NDC
    vertex.position.x = vertex.position.x / vertex.position.w;
    vertex.position.y = vertex.position.y / vertex.position.w;
    vertex.position.z = vertex.position.z / vertex.position.w;

    vertex.texcoord.x = vertex.texcoord.x * vertex.onePerZ;
    vertex.texcoord.y = vertex.texcoord.z * vertex.onePerZ;
    
    // ndc->屏幕坐标，注意这里转换完的屏幕坐标左上角为[0，0]
    vertex.position.x = (vertex.position.x + 1) * 0.5 * this.canvasWidth;
    vertex.position.y = (1 - vertex.position.y) * 0.5 * this.canvasHeight;
}

Renderer.prototype.CVVClip = function(vertex)
{
    //此处还未进行透视除法。为什么用x,y,z与w比较?结合透视除法之后x,y,z在NDC空间中的范围是 x-1,1  y-1,1  z0,1，则未经透视除法之前的x=[-w,w],y=[-w,w],z=[0,w]
    if(vertex.position.x >= -vertex.position.w && vertex.position.x <= vertex.position.w &&
        vertex.position.y >= -vertex.position.w && vertex.position.y <= vertex.position.w && 
        vertex.position.z >= 0 && vertex.position.z <= vertex.position.w)
    {
        return false;
    }

    return true;
};

Renderer.prototype.ccwJudge = function (v1 , v2 , v3) {
    let d1 = v2.position.subtract(v1.position);
    let d2 = v3.position.subtract(v1.position);
    d1.z = 0;
    d2.z = 0;

    let d = Vector3.Cross(d1 , d2);

    d.normalize();

    let lhr = new Vector3(0 , 0 , 1);

    return Vector3.Dot(d , lhr) < 0;
};