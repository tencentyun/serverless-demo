package com.tencent.scfspringbootjava8;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;

//@SpringBootTest
class ScfSpringbootJava8ApplicationTests {

	@Test
	void contextLoads() {
		List<String> ss = new ArrayList<>();
		ss.add("dd");
		System.out.println(ss.toString());
	}

}
