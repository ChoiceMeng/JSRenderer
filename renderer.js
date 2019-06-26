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
            raster.WireFrameRaster(v1, v2, v3);
        } else {
            let res = raster.SolidRaster(v1, v2, v3);
            res.forEach(v => {
                let color = DirectionLightShader_PS(v, texture, light);
                this.drawPoint(v.position, color);
            });
        }
    }

};

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