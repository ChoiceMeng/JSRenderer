function Vector2(inX, inY){
    this.x = inX;
    this.y = inY;
}

Vector2.prototype.add = function (rightVect) {
    return new Vector2(this.x+rightVect.x, this.y + rightVect.y);
};

Vector2.prototype.sub = function(rightVect)
{
    return new Vector2(this.x-rightVect.x, this.y - rightVect.y);
};

Vector2.prototype.negate = function()
{
    return new Vector2(-this.x, -this.y);
};

Vector2.prototype.scale=function(scale)
{
    return new Vector2(this.x * scale, this.y * scale);
};

Vector2.prototype.equal=function(rightVect)
{
    return this.x == rightVect.x && this.y == rightVect.y;
};

Vector2.prototype.length=function()
{
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector3.prototype.lengthSqrt=function()
{
    return this.x * this.x + this.y * this.y;
};

Vector2.prototype.normalize=function()
{
    let len = this.length();
    if(len == 0)
        return;

    let num = 1.0 / len;
    this.x *= num;
    this.y *= num;
};

Vector2.Zero = function()
{
    return new Vector2(0, 0);
};

Vector2.Copy = function(src)
{
    return new Vector2(src.x, src.y);
};

Vector2.Normalize = function(vec)
{
    let newVec = Vector2.Copy(vec);
    newVec.normalize();
    return newVec;
};

Vector2.DistanceSqrared = function(pos1, pos2)
{
    let disX = pos1.x - pos2.x;
    let disY = pos1.y - pos2.y;
    return (disX * disX + disY * disY);
};

Vector2.Distance = function(pos1, pos2)
{
    return Math.sqrt(Vector2.DistanceSqrared(pos1, pos2));
};

Vector2.Transform = function Transform(vector, transformation) {
    let x = vector.x * transformation[0] + vector.y * transformation[4];
    let y = vector.x * transformation[1] + vector.y * transformation[5];

    return new Vector(x, y);
};

/////////////////Vector3
function Vector3(initX, initY, initZ, initW)
{
    this.x = initX;
    this.y = initY;
    this.z = initZ;
    this.w = initW;
};

Vector3.prototype.add = function (otherVector) {
    return new Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
};
Vector3.prototype.subtract = function (otherVector) {
    return new Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
};
Vector3.prototype.negate = function () {
    return new Vector3(-this.x, -this.y, -this.z);
};
Vector3.prototype.scale = function (scale) {
    return new Vector3(this.x * scale, this.y * scale, this.z * scale);
};
Vector3.prototype.equals = function (otherVector) {
    return this.x == otherVector.x && this.y == otherVector.y && this.z == otherVector.z;
};
Vector3.prototype.length = function () {
    return Math.sqrt(this.lengthSquared());
};
Vector3.prototype.lengthSquared = function () {
    return this.x * this.x + this.y * this.y + this.z * this.z;
};
Vector3.prototype.normalize = function () {
    let leng = this.length();
    if(leng === 0)
        return;

    let num = 1 / leng;
    this.x *= num;
    this.y *= num;
    this.z *= num;
};
Vector3.Zero = function Zero() {
    return new Vector3(0, 0, 0);
};
Vector3.Up = function Up() {
    return new Vector3(0, 1, 0);
};
Vector3.Copy = function Copy(source) {
    return new Vector3(source.x, source.y, source.z, source.w);
};


Vector3.TransformCoordinates = function TransformCoordinates(vector, transformation) {
    let x = vector.x * transformation.m[0] + vector.y * transformation.m[4] + vector.z * transformation.m[8] + transformation.m[12];
    let y = vector.x * transformation.m[1] + vector.y * transformation.m[5] + vector.z * transformation.m[9] + transformation.m[13];
    let z = vector.x * transformation.m[2] + vector.y * transformation.m[6] + vector.z * transformation.m[10] + transformation.m[14];
    let w = vector.x * transformation.m[3] + vector.y * transformation.m[7] + vector.z * transformation.m[11] + transformation.m[15];

    return new Vector3(x, y, z, w);
};
Vector3.TransformNormal = function TransformNormal(vector, transformation) {
    let x = vector.x * transformation.m[0] + vector.y * transformation.m[4] + vector.z * transformation.m[8];
    let y = vector.x * transformation.m[1] + vector.y * transformation.m[5] + vector.z * transformation.m[9];
    let z = vector.x * transformation.m[2] + vector.y * transformation.m[6] + vector.z * transformation.m[10];

    return new Vector2(x, y, z);
};
Vector3.Dot = function Dot(left, right) {
    return left.x * right.x + left.y * right.y + left.z * right.z;
};
Vector3.Cross = function Cross(left, right) {
    let x = left.y * right.z - left.z * right.y;
    let y = left.z * right.x - left.x * right.z;
    let z = left.x * right.y - left.y * right.x;
    return new Vector3(x, y, z);
};
Vector3.Normalize = function Normalize(vector) {
    let newVec = Vector3.Copy(vector);
    newVec.normalize();
    return newVec;
};
Vector3.Distance = function Distance(value1, value2) {
    return Math.sqrt(Vector3.DistanceSquared(value1, value2));
};
Vector3.DistanceSquared = function DistanceSquared(value1, value2) {
    let x = value1.x - value2.x;
    let y = value1.y - value2.y;
    let z = value1.z - value2.z;

    return x * x + y * y + z * z;
};