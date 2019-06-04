function Quaternion(){

}

function Quaternion(w,x,y,z){
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
}

Quaternion.prototype.identity = function(){
    this.w = 1;
    this.x = this.y = this.z = 0;
};

Quaternion.kQuaternionIdentity = function()
{ 
    return new Quaternion(1.0, 0.0, 0.0, 0.0);
};

// 绕x旋转
Quaternion.prototype.setRotateX = function(theta)
{
    this.w = Math.cos(theta*0.5);
    this.x = Math.sin(theta*0.5);
    this.y = 0;
    this.z = 0;
};

// 绕y旋转
Quaternion.prototype.setRotateX = function(theta)
{
    this.w = Math.cos(theta*0.5);
    this.x = 0;
    this.y = Math.sin(theta*0.5);
    this.z = 0;
};

// 绕z旋转
Quaternion.prototype.setRotateX = function(theta)
{
    this.w = Math.cos(theta*0.5);
    this.x = 0;
    this.y = 0;
    this.z = Math.sin(theta*0.5);
};

// 获得当前四元数的旋转轴
Quaternion.prototype.getRotationAxis = function()
{
    let sinValue2 = 1.0 - w * w; // w * w = cos(theta)^2 => cos(theta)^2 + sin(theta)^2 = 1
    // 倒数做除法
    let sinValue = 1.0 / Math.sqrt(sinValue2);

    return new Vector3(x*sinValue, y*sinValue, z*sinValue);
}

// 叉乘:注:现在有两个不一样叉乘的公式，测试结果
Quaternion.prototype.Cross = function(otherQua)
{
    let result = new Quaternion();
    result.w = this.w * otherQua.w - this.x*otherQua.x - this.y*otherQua.y - this.z*otherQua.z;
    result.x = this.w * otherQua.x + this.x*otherQua.w + this.z*otherQua.y - this.y*otherQua.z;
    result.y = this.w * otherQua.y + this.y*otherQua.w + this.x*otherQua.z - this.z*otherQua.x;
    result.z = this.w * otherQua.z + this.z*otherQua.w + this.y*otherQua.x - this.x*otherQua.y;

    return result;
}

Quaternion.prototype.normalize = function()
{
    let mag = Math.sqrt(w*w + x*x + y*y + z*z);
    if(msg > 0.0)
    {
        let overMag = 1.0 / mag;
        this.w *= overMag;
        this.x *= overMag;
        this.y *= overMag;
        this.z *= overMag;
    }
    else{
        identity();
    }
}

Quaternion.prototype.identity = function()
{
    this.w = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
}

Quaternion.prototype.dotProduct = function(otherQua)
{
    return this.w * otherQua.w + this.x * otherQua.x + this.y * otherQua.y + this.z * otherQua.z;
}

Quaternion.prototype.conjugate = function()
{
    let result = new Quaternion();
    result.w = q.w;
    result.x = -q.x;
    result.y = -q.y;
    result.z = -q.z;

    return result; 
}

