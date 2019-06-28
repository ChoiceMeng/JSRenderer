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

            let v1 = DirectionLightShader_VS(mesh.Vertices[face.A], worldMatrix, viewMatrix, projectionMatrix);
            let v2 = DirectionLightShader_VS(mesh.Vertices[face.B], worldMatrix, viewMatrix, projectionMatrix);
            let v3 = DirectionLightShader_VS(mesh.Vertices[face.C], worldMatrix, viewMatrix, projectionMatrix);

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
                let color = DirectionLightShader_PS(v, texture, light);
                this.drawPoint(v.position, color);
            });
        }
    }

};

// 点光源着色接口
Device.prototype.renderPointLightShader = function (model, worldMatrix, viewMatrix, projectionMatrix, texture, light) {

    let shader = new ShaderDevice(this);
    let raster = new Raster(this);

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
    if(CVVClip(v1) || CVVClip(v2) || CVVClip(v3)) return;

    this.TransToScreenPos(v1);
    this.TransToScreenPos(v2);
    this.TransToScreenPos(v3);

    if(device.enableCCWCull && this.ccwJudge(v1 , v2 , v3)){
        return [];
    }

    if(device.enableCWCull && !this.ccwJudge(v1 , v2 , v3)){
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

// 光栅化三角形
Renderer.prototype.RasterTriangle = function (v1, v2, v3) {
    // 判断三角形类型
    if(v1.position.y == v2.position.y)
    {
        // 平顶
        if(v1.position.y > v3.position.y)
        {
            DrawTriangleTop(v1, v2, v3);
        }
        else{
            // 平底
            DrawTriangleBottom(v3, v1, v2);
        }
    }
    else if(v1.position.y == v3.position.y)
    {
        // 平顶
        if(v1.position.y > v2.position.y)
        {
            DrawTriangleTop(v1, v3, v2);
        }
        else{
            // 平底
            DrawTriangleBottom(v2, v1, v3);
        }
    }
    else if(v2.position.y == v3.position.y)
    {
        // 平顶
        if(v2.position.y > v1.position.y)
        {
            DrawTriangleTop(v2, v3, v1);
        }
        else
        {
            // 平底
            DrawTriangleBottom(v1, v2, v3);
        }
    }
    else{
        // 需分割三角形
        let top;
        let mid;
        let bottom;

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

        
    }
}

// 光栅化平底三角形:v1为上顶点
Renderer.prototype.DrawTriangleBottom = function(v1, v2, v3)
{

}

// 光栅化平顶三角形:v3为下顶点
Renderer.prototype.DrawTriangleTop = function(v1, v2, v3)
{

}

Renderer.prototype.TransToScreenPos = function(vertex)
{
    // 先执行透视除法，由CVV->NDC
    vertex.position.x = vertex.position.x / vertex.position.w;
    vertex.position.y = vertex.position.y / vertex.position.w;
    vertex.position.z = vertex.position.z / vertex.position.w;
    
    // ndc->屏幕坐标，注意这里转换完的屏幕坐标左上角为[0，0]
    vertex.position.x = (vertex.position.x + 1) * 0.5 * this.canvasWidth;
    vertex.position.y = (1 - vertex.position.y) * 0.5 * this.canvasHeight;
}

Renderer.prototype.CVVClip(vertex) = function(vertex)
{
    //此处还未进行透视除法。为什么用x,y,z与w比较?结合透视除法之后x,y,z在NDC空间中的范围是 x-1,1  y-1,1  z0,1，则未经透视除法之前的x=[-w,w],y=[-w,w],z=[0,w]
    if(vertex.position.x >= -vertex.position.w && vertex.position.x <= vertex.position.w &&
        vertex.position.y >= -vertex.position.w && vertex.position.y <= vertex.position.w && 
        vertex.position.z >= 0 && vertex.position.z <= vertex.position.w)
    {
        return true;
    }

    return false;
}

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