---
title:  Netty面试题
published: 2026-10-17
description: "Netty面试题，62道Netty八股文"
image: ""
tags: ["java","面试", "八股文"]
category: 面试
draft: false
---


### 01、说说 Netty 的原理和流程

Netty 是一个基于Java NIO的高性能异步事件驱动的网络应用框架，极大简化了网络编程的复杂性。

常用于构建 RPC 框架，以提升分布式服务之间的通信效率。像 Dubbo 的网络层就可以基于 Netty 来实现。

![Netty 官方架构图](https://raw.githubusercontent.com/0ZAWSZE0/resource/main/inklog-astro/posts/netty/img.png)

Netty 支持零拷贝、可拓展事件模型；支持 TCP、UDP、HTTP、WebSocket 等多种协议；提供安全传输、可压缩、大文件、编解码等多种功能。

![码海：Netty 的样子](https://raw.githubusercontent.com/0ZAWSZE0/resource/main/inklog-astro/posts/netty/img_1.png)

Netty 是基于主从 Reactor 模式实现的，主要分为两个线程组：

①、主 Reactor 线程组（Boss Group）

负责处理新的客户端连接请求。它内部维护一个或多个线程，每个线程都包含一个 Selector。

ServerSocketChannel 注册到 BossGroup 的 Selector 上，只关注 OP_ACCEPT 事件，即新的连接建立请求。

当 BossGroup 的 Selector 接收到连接请求时，使用 `ServerSocketChannel.accept()` 方法来接受新连接。

接受到的新连接被封装为 NioSocketChannel，并注册到 Worker Group 的 Selector 上。

②、从 Reactor 线程组（Worker Group）

WorkerGroup 管理的线程可能有多个，每个线程也是维护自己的 Selector。Netty 通常会根据一定的策略（如轮询）选择一个 Selector 来平衡负载。

每个 Selector 负责监听和处理所有已注册的 NioSocketChannel 的 IO 事件，如读 (OP_READ)、写 (OP_WRITE) 事件等。

当事件发生时，相应的 ChannelHandler 被调用来处理这些事件。这些 Handler 可以是用户自定义的处理器，用于实现具体的业务逻辑。

![码海：Netty 工作架构图](https://raw.githubusercontent.com/0ZAWSZE0/resource/main/inklog-astro/posts/netty/img_2.png)

#### 请说一下 Netty 的工作流程？

下面是一个简单的 Netty 服务器和客户端的示例，展示了基本的工作流程。这个例子中，服务器接收字符串消息，转换为大写形式后返回给客户端。

NettyServer：

```java
public class NettyServer {
    private final int port;

    public NettyServer(int port) {
        this.port = port;
    }

    public void start() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                     .channel(NioServerSocketChannel.class)
                     .childHandler(new ChannelInitializer<SocketChannel>() {
                         @Override
                         protected void initChannel(SocketChannel ch) throws Exception {
                             ch.pipeline().addLast(new StringDecoder());
                             ch.pipeline().addLast(new StringEncoder());
                             ch.pipeline().addLast(new ServerHandler());
                         }
                     })
                     .option(ChannelOption.SO_BACKLOG, 128)
                     .childOption(ChannelOption.SO_KEEPALIVE, true);

            ChannelFuture future = bootstrap.bind(port).sync();
            System.out.println("Server started on port " + port);
            future.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyServer(8080).start();
    }

    static class ServerHandler extends ChannelInboundHandlerAdapter {
        @Override
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            String input = (String) msg;
            System.out.println("Received: " + input);
            ctx.writeAndFlush(input.toUpperCase());
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            cause.printStackTrace();
            ctx.close();
        }
    }
}
```

①、BossGroup 和 WorkerGroup：

服务器初始化时，首先创建两个 NioEventLoopGroup 实例。

BossGroup 用于接受客户端的连接，WorkerGroup 用于处理连接后的数据传输。

- BossGroup 监听端口上的连接请求，每当接收到新连接时，BossNioEventLoop 就会处理连接请求，接受连接，并将新的 SocketChannel 注册到 WorkerGroup 的一个 NioEventLoop 上。
- 当 WorkerGroup 的 NioEventLoop 监测到 IO 事件（如读取数据），它会根据注册的 ChannelPipeline 中的 ChannelHandlers 处理这些事件。在示例中，服务器端收到数据后，通过一个 ServerHandler 将数据转换为大写并返回给客户端。

②、ServerBootstrap：配置服务器使用的辅助启动类。设置服务器要使用的 channel 类型为 NioServerSocketChannel。

并为新接入的连接定义 ChannelInitializer，在这个初始化器中，配置 ChannelPipeline，包括编解码器和业务处理器。

NettyClient：

```java
public class NettyClient {
    private final String host;
    private final int port;

    public NettyClient(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public void start() throws Exception {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ch.pipeline().addLast(new StringDecoder());
                            ch.pipeline().addLast(new StringEncoder());
                            ch.pipeline().addLast(new ClientHandler());
                        }
                    });

            Channel channel = bootstrap.connect(host, port).sync().channel();
            Scanner scanner = new Scanner(System.in);
            while (true) {
                String line = scanner.nextLine();
                if ("quit".equalsIgnoreCase(line)) {
                    channel.close();
                    break;
                }
                channel.writeAndFlush(line);
            }
            channel.closeFuture().sync();
        } finally {
            group.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyClient("localhost", 8080).start();
    }

    static class ClientHandler extends SimpleChannelInboundHandler<String> {
        @Override
        protected void channelRead0(ChannelHandlerContext ctx, String msg) {
            System.out.println("Received from server: " + msg);
        }

        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            cause.printStackTrace();
            ctx.close();
        }
    }
}
```

①、EventLoopGroup：客户端只需要一个 NioEventLoopGroup 来处理所有操作，包括创建连接、发送数据和接收数据。

②、Bootstrap：配置客户端使用的辅助启动类。设置客户端要使用的 channel 类型为 NioSocketChannel。

客户端使用 Scanner 从命令行读取用户输入，发送到服务器；同时，它也能接收服务器返回的数据，并通过 ClientHandler 打印到控制台。


> 1. [Java 面试指南（付费）](https://javabetter.cn/zhishixingqiu/mianshi.html)收录的华为面经同学 6 Java 通用软件开发一面面试原题：手画Netty原理和流程

---


